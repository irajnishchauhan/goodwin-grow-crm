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
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    // Client isolation check
    if (tenantCtx.isClientUser && asset.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.creativeComment.findMany({
      where: {
        assetId: id,
        tenantId: tenantCtx.tenant.id,
        ...(tenantCtx.isClientUser ? { isInternal: false } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
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
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    // Client isolation check
    if (tenantCtx.isClientUser && asset.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cannot comment on another client's asset" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const content = body.content || body.comment;
    const { versionNumber, isInternal } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Comment content cannot be empty" }, { status: 400 });
    }

    // Clients can NEVER create internal agency notes
    const resolvedIsInternal = tenantCtx.isClientUser ? false : Boolean(isInternal);

    const comment = await prisma.creativeComment.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        assetId: id,
        versionNumber: versionNumber || asset.version,
        authorName: tenantCtx.user.fullName,
        authorRole: tenantCtx.primaryRole,
        content: content.trim(),
        isInternal: resolvedIsInternal,
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}
