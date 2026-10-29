import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { getPackageByName, SERVICE_PACKAGES } from "@/lib/agency/packages";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Client users cannot access internal agency expenses" },
      { status: 403 }
    );
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
    const recordedExpenses = c.expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    const pkgDef = getPackageByName(c.activePackage);
    const estimatedCost = Number(c.estimatedDeliveryCost) || (pkgDef ? pkgDef.estimatedDeliveryCost : Math.round(Number(c.monthlyRetainer) * 0.3));
    const totalExpenses = recordedExpenses > 0 ? recordedExpenses : estimatedCost;
    const netProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      clientId: c.id,
      clientName: c.name,
      activePackage: c.activePackage || "Growth Retainer",
      monthlyRetainer: Number(c.monthlyRetainer),
      totalRevenue,
      totalExpenses,
      netProfit,
      grossMargin: Math.round(grossMargin),
    };
  });

  // Calculate package-wise profitability breakdown
  const packageMap = new Map<string, { packageName: string; clientCount: number; totalRevenue: number; totalCost: number; netProfit: number; grossMargin: number }>();
  profitability.forEach((p) => {
    if (!packageMap.has(p.activePackage)) {
      packageMap.set(p.activePackage, {
        packageName: p.activePackage,
        clientCount: 0,
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        grossMargin: 0,
      });
    }
    const pm = packageMap.get(p.activePackage)!;
    pm.clientCount += 1;
    pm.totalRevenue += p.totalRevenue;
    pm.totalCost += p.totalExpenses;
  });

  const packageProfitability = Array.from(packageMap.values()).map((pm) => {
    const net = pm.totalRevenue - pm.totalCost;
    const margin = pm.totalRevenue > 0 ? Math.round((net / pm.totalRevenue) * 100) : 0;
    return { ...pm, netProfit: net, grossMargin: margin };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return NextResponse.json({
    success: true,
    data: {
      expenses,
      profitability,
      packageProfitability,
    },
  });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot create internal agency expenses" },
        { status: 403 }
      );
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
