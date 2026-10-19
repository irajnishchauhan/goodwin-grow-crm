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
      include: { client: true },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
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

    const body = await req.json();
    const { title, assetType, dimensions, fileUrl, reviewStatus, clientFeedback, clientId } = body;

    const updated = await prisma.creativeAsset.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        assetType: assetType !== undefined ? assetType : existing.assetType,
        dimensions: dimensions !== undefined ? dimensions : existing.dimensions,
        fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        reviewStatus: reviewStatus ?? existing.reviewStatus,
        clientFeedback: clientFeedback !== undefined ? clientFeedback : existing.clientFeedback,
        reviewedAt: reviewStatus === "APPROVED" ? new Date() : existing.reviewedAt,
      },
      include: { client: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update asset" },
      { status: 500 }
    );
  }
}

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
