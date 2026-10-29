import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const asset = await prisma.creativeAsset.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: {
        client: true,
        versions: { orderBy: { versionNumber: "desc" } },
        comments: {
          where: tenantCtx.isClientUser ? { isInternal: false } : {},
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    // Client Isolation: One client must NEVER access another client's assets
    if (tenantCtx.isClientUser && asset.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access to another client's creative asset is denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.creativeAsset.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    // Client Isolation: Check ownership
    if (tenantCtx.isClientUser && existing.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You cannot modify another client's asset" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      action,
      title,
      assetType,
      dimensions,
      fileUrl,
      mediaType,
      reviewStatus,
      clientFeedback,
      clientId,
    } = body;

    if (tenantCtx.isClientUser && action === "upload_version") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot upload new creative versions" },
        { status: 403 }
      );
    }

    // Build update payload with audit approver and timestamps
    const updateData: any = {};

    if (tenantCtx.isClientUser) {
      // Clients can only submit approval or request changes
      if (reviewStatus !== undefined) {
        if (!["APPROVED", "CHANGES_REQUESTED"].includes(reviewStatus)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Clients can only set status to APPROVED or CHANGES_REQUESTED" },
            { status: 403 }
          );
        }
        updateData.reviewStatus = reviewStatus;
      }
      if (clientFeedback !== undefined) {
        updateData.clientFeedback = clientFeedback;
      }
    } else {
      if (title !== undefined) updateData.title = title;
      if (assetType !== undefined) updateData.assetType = assetType;
      if (dimensions !== undefined) updateData.dimensions = dimensions;
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
      if (mediaType !== undefined) updateData.mediaType = mediaType;
      if (clientId !== undefined) updateData.clientId = clientId || null;
      if (reviewStatus !== undefined) updateData.reviewStatus = reviewStatus;
      if (clientFeedback !== undefined) updateData.clientFeedback = clientFeedback;
    }

    // Record approver and timestamp when transitioning to APPROVED
    if (updateData.reviewStatus === "APPROVED") {
      updateData.approverName = tenantCtx.user.fullName;
      updateData.approverEmail = tenantCtx.user.email;
      updateData.approvedAt = new Date();
      updateData.reviewedAt = new Date();
    } else if (updateData.reviewStatus === "CHANGES_REQUESTED") {
      updateData.reviewedAt = new Date();
    }

    const updated = await prisma.creativeAsset.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        versions: { orderBy: { versionNumber: "desc" } },
        comments: {
          where: tenantCtx.isClientUser ? { isInternal: false } : {},
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // If client requested changes or provided feedback, create comment automatically
    if (clientFeedback && clientFeedback.trim()) {
      await prisma.creativeComment.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          assetId: id,
          versionNumber: updated.version,
          authorName: tenantCtx.user.fullName,
          authorRole: tenantCtx.primaryRole,
          content: clientFeedback.trim(),
          isInternal: false,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update asset" },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Clients cannot delete creative assets" },
        { status: 403 }
      );
    }

    const existing = await prisma.creativeAsset.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    await prisma.creativeAsset.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Asset deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete asset" },
      { status: 500 }
    );
  }
}

