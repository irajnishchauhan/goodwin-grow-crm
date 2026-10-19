import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (status && status !== "ALL") whereClause.status = status;
  if (clientId) whereClause.clientId = clientId;

  const invoices = await prisma.agencyInvoice.findMany({
    where: whereClause,
    orderBy: { issueDate: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true, email: true, phone: true } },
    },
  });

  return NextResponse.json({ success: true, data: invoices });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, subtotal, taxAmount, totalAmount, dueDate, items } = body;

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client is required" }, { status: 400 });
    }

    const count = await prisma.agencyInvoice.count({ where: { tenantId: tenantCtx.tenant.id } });
    const invoiceNumber = `INV-GGA-2026-${String(count + 1).padStart(3, "0")}`;

    const sub = subtotal ? Number(subtotal) : 0;
    const tax = taxAmount !== undefined ? Number(taxAmount) : sub * 0.18; // default 18% GST
    const total = totalAmount ? Number(totalAmount) : sub + tax;

    const invoice = await prisma.agencyInvoice.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 10 * 86400000),
        subtotal: sub,
        taxAmount: tax,
        totalAmount: total,
        status: "SENT",
        items: items || [],
        paymentMethod: "Bank Transfer / UPI",
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
