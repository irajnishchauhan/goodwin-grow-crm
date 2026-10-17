import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";

describe("Commercial Quotations & Financial Calculations", () => {
  it("should calculate line items, discounts, and taxes with exact decimal precision", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });
    const user = await prisma.user.findFirst({
      where: { memberships: { some: { tenantId: tenant!.id } } },
    });

    expect(tenant).toBeDefined();
    expect(user).toBeDefined();

    const items = [
      { quantity: 10, unitPrice: 15450.5, discount: 500, taxRate: 18 },
      { quantity: 2, unitPrice: 3200, discount: 0, taxRate: 12 },
    ];

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = items.map((it) => {
      const lineSub = it.quantity * it.unitPrice;
      const lineTax = (lineSub - it.discount) * (it.taxRate / 100);
      subtotal += lineSub;
      totalDiscount += it.discount;
      totalTax += lineTax;

      return {
        description: "Test Battery Product",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        taxRate: it.taxRate,
        lineTotal: lineSub - it.discount + lineTax,
      };
    });

    const totalAmount = subtotal - totalDiscount + totalTax;

    const quotation = await prisma.quotation.create({
      data: {
        tenantId: tenant!.id,
        quotationNumber: `QT-TEST-${Date.now()}`,
        status: "DRAFT",
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount,
        createdById: user!.id,
        items: {
          create: processedItems,
        },
      },
      include: { items: true },
    });

    expect(Number(quotation.subtotal)).toBe(160905);
    expect(Number(quotation.discountAmount)).toBe(500);
    // Line 1: (154505 - 500) * 0.18 = 27720.90
    // Line 2: 6400 * 0.12 = 768.00
    // Total Tax: 28488.90
    expect(Number(quotation.taxAmount)).toBeCloseTo(28488.9, 2);
    // Total Amount: 160905 - 500 + 28488.90 = 188893.90
    expect(Number(quotation.totalAmount)).toBeCloseTo(188893.9, 2);

    // Cleanup
    await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
    await prisma.quotation.delete({ where: { id: quotation.id } });
  });
});
