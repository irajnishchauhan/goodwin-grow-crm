import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

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

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Clients cannot upload revised creative versions directly" },
        { status: 403 }
      );
    }

    const asset = await prisma.creativeAsset.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { versions: true },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fileUrl, mediaType, changelog, submittedBy } = body;

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "File URL is required for new version" }, { status: 400 });
    }

    const newVersionNumber = asset.version + 1;
    const resolvedMediaType = mediaType || (fileUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? "video" : "image");

    // 1. Create new version record
    const versionRecord = await prisma.creativeVersion.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        assetId: asset.id,
        versionNumber: newVersionNumber,
        fileUrl,
        mediaType: resolvedMediaType,
        changelog: changelog || `Version ${newVersionNumber} revision submitted`,
        submittedBy: submittedBy || tenantCtx.user.fullName,
      },
    });

    // 2. Update asset: bump version, update current URL/mediaType, and RESET status to INTERNAL_REVIEW (requires fresh approval)
    const updatedAsset = await prisma.creativeAsset.update({
      where: { id: asset.id },
      data: {
        version: newVersionNumber,
        fileUrl,
        mediaType: resolvedMediaType,
        reviewStatus: "INTERNAL_REVIEW", // A revised creative requires fresh approval
        approverName: null,
        approverEmail: null,
        approvedAt: null,
        clientFeedback: null,
      },
      include: {
        client: true,
        versions: { orderBy: { versionNumber: "desc" } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAsset,
      newVersion: versionRecord,
      message: `Version ${newVersionNumber} submitted. Review status reset to Internal Review for fresh approval.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit new creative version" },
      { status: 500 }
    );
  }
}
