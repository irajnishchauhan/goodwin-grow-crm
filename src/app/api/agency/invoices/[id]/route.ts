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

    const existing = await prisma.agencyInvoice.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, paymentMethod } = body;

    const updated = await prisma.agencyInvoice.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        paymentMethod: paymentMethod ?? existing.paymentMethod,
        paidAt: status === "PAID" ? new Date() : existing.paidAt,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}
