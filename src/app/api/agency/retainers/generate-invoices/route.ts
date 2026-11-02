import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot generate retainer invoices" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;

    // 1. Fetch active retainer clients
    const activeClients = await prisma.agencyClient.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        monthlyRetainer: { gt: 0 },
      },
    });

    if (activeClients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active clients with recurring retainers found.",
        generatedCount: 0,
        invoices: [],
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthName = now.toLocaleString("default", { month: "long" });

    // 2. Fetch existing invoices for this month to prevent duplicate billing
    const existingInvoices = await prisma.agencyInvoice.findMany({
      where: { tenantId },
      select: { id: true, clientId: true, invoiceNumber: true, issueDate: true },
    });

    let maxSeq = existingInvoices.length;
    for (const inv of existingInvoices) {
      const match = inv.invoiceNumber?.match(/INV-GGA-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }

    const existingNumberSet = new Set(existingInvoices.map((i) => i.invoiceNumber));
    const generatedInvoices = [];

    for (const client of activeClients) {
      // Check if already invoiced this calendar month
      const alreadyInvoiced = existingInvoices.some((inv) => {
        if (inv.clientId !== client.id) return false;
        const invDate = new Date(inv.issueDate);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });

      if (alreadyInvoiced) {
        continue;
      }

      maxSeq += 1;
      let invoiceNumber = `INV-GGA-${currentYear}-${String(maxSeq).padStart(3, "0")}`;
      while (existingNumberSet.has(invoiceNumber)) {
        maxSeq += 1;
        invoiceNumber = `INV-GGA-${currentYear}-${String(maxSeq).padStart(3, "0")}`;
      }
      existingNumberSet.add(invoiceNumber);

      const retainerAmount = Number(client.monthlyRetainer) || 0;
      const gstAmount = Math.round(retainerAmount * 0.18);
      const totalAmount = retainerAmount + gstAmount;

      const invoice = await prisma.agencyInvoice.create({
        data: {
          tenantId,
          clientId: client.id,
          clientName: client.brandName || client.name,
          clientBillingDetails: {
            brandName: client.brandName,
            email: client.email,
            phone: client.phone,
          },
          invoiceNumber,
          issueDate: now,
          dueDate: new Date(Date.now() + 10 * 86400000), // 10 days payment terms
          subtotal: retainerAmount,
          taxAmount: gstAmount,
          totalAmount: totalAmount,
          status: "SENT",
          items: [
            {
              description: `${client.activePackage || "Marketing & Growth Retainer"} — ${monthName} ${currentYear}`,
              sacCode: "998311",
              quantity: 1,
              unitPrice: retainerAmount,
              amount: retainerAmount,
            },
          ],
          paymentMethod: "Bank Transfer / UPI (Razorpay)",
        },
      });

      generatedInvoices.push(invoice);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedInvoices.length} recurring retainer tax invoices for ${monthName} ${currentYear}.`,
      generatedCount: generatedInvoices.length,
      invoices: generatedInvoices,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate retainer invoices" },
      { status: 500 }
    );
  }
}

