import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (clientId) whereClause.clientId = clientId;

  const expenses = await prisma.agencyExpense.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true } },
    },
  });

  // Calculate profitability summary
  const clients = await prisma.agencyClient.findMany({
    where: { tenantId: tenantCtx.tenant.id, status: "ACTIVE" },
    include: {
      expenses: true,
      invoices: { where: { status: "PAID" } },
    },
  });

  const profitability = clients.map((c) => {
    const totalRevenue = c.invoices.reduce((acc, inv) => acc + Number(inv.subtotal), 0) || Number(c.monthlyRetainer);
    const totalExpenses = c.expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      clientId: c.id,
      clientName: c.name,
      monthlyRetainer: Number(c.monthlyRetainer),
      totalRevenue,
      totalExpenses,
      netProfit,
      grossMargin: Math.round(grossMargin),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      expenses,
      profitability,
    },
  });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, description, amount, clientId, isBillable } = body;

    if (!description || !amount) {
      return NextResponse.json({ success: false, error: "Description and amount are required" }, { status: 400 });
    }

    const expense = await prisma.agencyExpense.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: clientId || null,
        category: category || "Software Tools",
        description,
        amount: Number(amount),
        date: new Date(),
        isBillable: !!isBillable,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: expense });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}
