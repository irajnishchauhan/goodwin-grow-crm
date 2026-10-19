import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

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
    const { reviewStatus, clientFeedback } = body;

    const updated = await prisma.creativeAsset.update({
      where: { id },
      data: {
        reviewStatus: reviewStatus ?? existing.reviewStatus,
        clientFeedback: clientFeedback !== undefined ? clientFeedback : existing.clientFeedback,
        reviewedAt: reviewStatus === "APPROVED" ? new Date() : existing.reviewedAt,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update review status" },
      { status: 500 }
    );
  }
}
