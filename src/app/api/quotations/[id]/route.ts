import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const quotation = await prisma.quotation.findFirst({
    where: { id, tenantId: tenantCtx.tenant.id },
    include: {
      items: { include: { product: true } },
      company: true,
      contact: true,
      deal: true,
      createdBy: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: quotation });
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
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:write permission" }, { status: 403 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, terms, validUntil, contactId, companyId, dealId, discountAmount, items } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: status ?? quotation.status,
        terms: terms !== undefined ? terms : quotation.terms,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : quotation.validUntil,
        contactId: contactId !== undefined ? (contactId || null) : quotation.contactId,
        companyId: companyId !== undefined ? (companyId || null) : quotation.companyId,
        dealId: dealId !== undefined ? (dealId || null) : quotation.dealId,
      };

      if (Array.isArray(items) && items.length > 0) {
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

        const finalDiscount = discountAmount !== undefined ? Number(discountAmount) : totalDiscount;
        const totalAmount = subtotal - finalDiscount + totalTax;

        updateData.subtotal = subtotal;
        updateData.discountAmount = finalDiscount;
        updateData.taxAmount = totalTax;
        updateData.totalAmount = totalAmount;

        await tx.quotationItem.deleteMany({
          where: { quotationId: quotation.id },
        });

        updateData.items = {
          create: processedItems,
        };
      } else if (discountAmount !== undefined) {
        const finalDiscount = Number(discountAmount) || 0;
        updateData.discountAmount = finalDiscount;
        updateData.totalAmount = Number(quotation.subtotal) - finalDiscount + Number(quotation.taxAmount);
      }

      return tx.quotation.update({
        where: { id: quotation.id },
        data: updateData,
        include: { items: true },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PUT = PATCH;

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
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!tenantCtx.hasPermission("quotations:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing quotations:write permission" }, { status: 403 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    await prisma.quotation.delete({ where: { id: quotation.id } });

    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
