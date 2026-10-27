import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { WarrantyClaimStatus } from "@prisma/client";

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

    const claim = await prisma.batteryWarrantyClaim.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { partner: true },
    });

    if (!claim) {
      return NextResponse.json({ success: false, error: "Warranty claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: claim });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const claim = await prisma.batteryWarrantyClaim.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!claim) {
      return NextResponse.json({ success: false, error: "Warranty claim not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, technicianNotes, replacementSerial, resolutionDate } = body;

    const updated = await prisma.batteryWarrantyClaim.update({
      where: { id: claim.id },
      data: {
        ...(status && { status: status as WarrantyClaimStatus }),
        ...(technicianNotes !== undefined && { technicianNotes }),
        ...(replacementSerial !== undefined && { replacementSerial }),
        resolutionDate: resolutionDate ? new Date(resolutionDate) : (status === "APPROVED" || status === "REPLACED" || status === "REJECTED" ? new Date() : undefined),
      },
      include: { partner: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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

    const claim = await prisma.batteryWarrantyClaim.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!claim) {
      return NextResponse.json({ success: false, error: "Warranty claim not found" }, { status: 404 });
    }

    await prisma.batteryWarrantyClaim.delete({ where: { id: claim.id } });

    return NextResponse.json({ success: true, message: "Warranty claim deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
