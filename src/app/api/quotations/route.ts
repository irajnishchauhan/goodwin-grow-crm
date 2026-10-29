import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const quotations = await prisma.quotation.findMany({
    where: { tenantId: tenantCtx.tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      deal: { select: { id: true, title: true } },
      items: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ success: true, data: quotations });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:write permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      dealId,
      contactId,
      companyId,
      validUntil,
      terms,
      items = [],
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quotation must contain at least one line item" },
        { status: 400 }
      );
    }

    // Generate quotation number (QT-YYYY-XXXX) safely using highest existing sequence number
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;
    const existingQuotes = await prisma.quotation.findMany({
      where: {
        tenantId,
        quotationNumber: { startsWith: prefix },
      },
      select: { quotationNumber: true },
    });

    let maxSeq = 0;
    for (const q of existingQuotes) {
      const seqPart = q.quotationNumber.slice(prefix.length);
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
    const quotationNumber = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;

    // Decimal math calculations
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 0;

      const lineSubtotal = quantity * unitPrice;
      const lineTax = (lineSubtotal - discount) * (taxRate / 100);
      const lineTotal = lineSubtotal - discount + lineTax;

      subtotal += lineSubtotal;
      totalDiscount += discount;
      totalTax += lineTax;

      return {
        productId: item.productId || null,
        description: item.description || "Service Item",
        quantity,
        unitPrice,
        discount,
        taxRate,
        lineTotal,
      };
    });

    const totalAmount = subtotal - totalDiscount + totalTax;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        quotationNumber,
        dealId: dealId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        status: "DRAFT",
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount,
        validUntil: validUntil ? new Date(validUntil) : null,
        terms: terms || "Payment due within 30 days of quotation acceptance.",
        createdById: tenantCtx.user.id,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create quotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("quotations:delete") && !tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of quotation IDs required" }, { status: 400 });
    }

    await prisma.quotationItem.deleteMany({ where: { quotationId: { in: ids } } }).catch(() => {});

    const deleted = await prisma.quotation.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} quotations`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
