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
      return NextResponse.json({ success: false, error: "Forbidden: Client users cannot convert quotations" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        company: true,
        contact: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    // Resolve or match client
    let agencyClient = null;
    if (quotation.contact?.email) {
      agencyClient = await prisma.agencyClient.findFirst({
        where: { tenantId, email: quotation.contact.email },
      });
    }
    if (!agencyClient && quotation.company?.name) {
      agencyClient = await prisma.agencyClient.findFirst({
        where: {
          tenantId,
          OR: [
            { name: quotation.company.name },
            { brandName: quotation.company.name },
          ],
        },
      });
    }

    // Determine invoice sequence number
    const existingInvoices = await prisma.agencyInvoice.findMany({
      where: { tenantId },
      select: { invoiceNumber: true },
    });

    const isBatteries = tenantCtx.tenant.code === "goodwin-batteries";
    const prefix = isBatteries ? "INV-GB-2026" : "INV-GGA-2026";
    let maxSeq = existingInvoices.length;

    for (const inv of existingInvoices) {
      const match = inv.invoiceNumber?.match(/INV-(?:GGA|GB)-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }

    let nextSeq = maxSeq + 1;
    let invoiceNumber = `${prefix}-${String(nextSeq).padStart(3, "0")}`;
    const existingNumberSet = new Set(existingInvoices.map((i) => i.invoiceNumber));
    while (existingNumberSet.has(invoiceNumber)) {
      nextSeq += 1;
      invoiceNumber = `${prefix}-${String(nextSeq).padStart(3, "0")}`;
    }

    // Map items
    const invoiceItems = quotation.items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const amt = qty * price - Number(it.discount || 0);
      return {
        description: it.description || it.product?.name || "Service Item",
        quantity: qty,
        unitPrice: price,
        amount: amt,
        sacCode: isBatteries ? "8507" : "998311",
      };
    });

    const clientDisplayName =
      quotation.company?.name ||
      `${quotation.contact?.firstName || ""} ${quotation.contact?.lastName || ""}`.trim() ||
      "Client Account";

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const inv = await tx.agencyInvoice.create({
        data: {
          tenantId,
          clientId: agencyClient?.id || null,
          clientName: clientDisplayName,
          clientBillingDetails: {
            brandName: quotation.company?.name || null,
            email: quotation.contact?.email || null,
            phone: quotation.contact?.phone || null,
          },
          invoiceNumber,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 10 * 86400000), // 10 days
          subtotal: Number(quotation.subtotal),
          taxAmount: Number(quotation.taxAmount),
          totalAmount: Number(quotation.totalAmount),
          status: "SENT",
          items: invoiceItems,
          paymentMethod: "Bank Transfer / UPI (Razorpay)",
        },
      });

      // 2. Update quotation status to ACCEPTED
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: "ACCEPTED" },
      });

      // 3. Log Activity
      await tx.activity.create({
        data: {
          tenantId,
          type: "NOTE",
          title: "Quotation Converted to Invoice",
          description: `Quotation "${quotation.quotationNumber}" converted to tax invoice ${inv.invoiceNumber} for ₹${Number(inv.totalAmount).toLocaleString("en-IN")}`,
          performedById: tenantCtx.user.id,
          contactId: quotation.contactId,
        },
      });

      return inv;
    });

    return NextResponse.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} converted to Invoice ${invoice.invoiceNumber}`,
      data: invoice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to convert quotation to invoice" },
      { status: 500 }
    );
  }
}
