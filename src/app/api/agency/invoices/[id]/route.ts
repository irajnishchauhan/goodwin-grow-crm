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

    if (tenantCtx.isClientUser && invoice.clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client invoice access is strictly prohibited" },
        { status: 403 }
      );
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

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify invoices" },
        { status: 403 }
      );
    }

    const existing = await prisma.agencyInvoice.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      clientName,
      clientBillingDetails,
      clientId,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      status,
      paymentMethod,
    } = body;

    const updated = await prisma.agencyInvoice.update({
      where: { id },
      data: {
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        clientName: clientName !== undefined ? clientName : existing.clientName,
        clientBillingDetails:
          clientBillingDetails !== undefined ? clientBillingDetails : (existing.clientBillingDetails ?? undefined),
        issueDate: issueDate !== undefined && issueDate ? new Date(issueDate) : existing.issueDate,
        dueDate: dueDate !== undefined && dueDate ? new Date(dueDate) : existing.dueDate,
        items: items !== undefined ? items : (existing.items ?? []),
        subtotal: subtotal !== undefined ? Number(subtotal) : existing.subtotal,
        taxAmount: taxAmount !== undefined ? Number(taxAmount) : existing.taxAmount,
        totalAmount: totalAmount !== undefined ? Number(totalAmount) : existing.totalAmount,
        status: status !== undefined ? status : existing.status,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
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
        { success: false, error: "Forbidden: Client users cannot delete invoices" },
        { status: 403 }
      );
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
