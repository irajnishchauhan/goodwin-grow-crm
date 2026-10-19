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

    const invoice = await prisma.agencyInvoice.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
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

    const existing = await prisma.agencyInvoice.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, paymentMethod, dueDate, items, subtotal, taxAmount, totalAmount } = body;

    const updated = await prisma.agencyInvoice.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
        dueDate: dueDate !== undefined ? new Date(dueDate) : existing.dueDate,
        items: items !== undefined ? items : existing.items,
        subtotal: subtotal !== undefined ? subtotal : existing.subtotal,
        taxAmount: taxAmount !== undefined ? taxAmount : existing.taxAmount,
        totalAmount: totalAmount !== undefined ? totalAmount : existing.totalAmount,
        paidAt: status === "PAID" ? (existing.paidAt || new Date()) : (status ? null : existing.paidAt),
      },
      include: { client: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update invoice" },
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

    const existing = await prisma.agencyInvoice.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    await prisma.agencyInvoice.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
