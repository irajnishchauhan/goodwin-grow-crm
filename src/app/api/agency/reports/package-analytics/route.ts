import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { SERVICE_PACKAGES, getPackageByName, calculatePackageProfitability } from "@/lib/agency/packages";

export async function GET(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = tenantCtx.tenant.id;
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [clients, invoices, expenses, notesCount] = await Promise.all([
      prisma.agencyClient.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        include: {
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
              dueDate: true,
            },
          },
          _count: {
            select: {
              notes: true,
              projects: true,
              tasks: true,
            },
          },
        },
      }),
      prisma.agencyInvoice.findMany({
        where: { tenantId },
      }),
      prisma.agencyExpense.findMany({
        where: { tenantId },
      }),
      prisma.agencyClientNote.count({
        where: { tenantId },
      }),
    ]);

    // 1. Client Status Breakdown
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
    const onboardingClients = clients.filter((c) => c.status === "ONBOARDING").length;
    const pausedClients = clients.filter((c) => c.status === "PAUSED").length;
    const churnedClients = clients.filter((c) => c.status === "CHURNED").length;

    // 2. Revenue & Delivery Costs
    const activeClientsList = clients.filter((c) => c.status === "ACTIVE");
    const totalMRR = activeClientsList.reduce((acc, c) => acc + Number(c.monthlyRetainer || 0), 0);
    const totalARR = totalMRR * 12;
    const avgRetainer = activeClients > 0 ? Math.round(totalMRR / activeClients) : 0;

    let totalDeliveryCosts = 0;
    activeClientsList.forEach((c) => {
      const explicitCost = Number(c.estimatedDeliveryCost || 0);
      if (explicitCost > 0) {
        totalDeliveryCosts += explicitCost;
      } else {
        const pkgDef = getPackageByName(c.activePackage);
        totalDeliveryCosts += pkgDef ? pkgDef.estimatedDeliveryCost : Math.round(Number(c.monthlyRetainer) * 0.3);
      }
    });

    const grossProfit = totalMRR - totalDeliveryCosts;
    const grossMarginPercent = totalMRR > 0 ? Math.round((grossProfit / totalMRR) * 1000) / 10 : 0;

    // 3. Package-wise Revenue & Unit Economics Matrix
    const packageMetricsMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      standardPrice: number;
      targetMargin: number;
      clientCount: number;
      activeCount: number;
      totalRevenue: number;
      totalDeliveryCost: number;
      netProfit: number;
      grossMarginPercent: number;
      clientNames: string[];
    }>();

    // Initialize with all 10 standardized service packages
    SERVICE_PACKAGES.forEach((pkg) => {
      packageMetricsMap.set(pkg.name, {
        id: pkg.id,
        name: pkg.name,
        category: pkg.category,
        standardPrice: pkg.price,
        targetMargin: pkg.targetGrossMarginPercent,
        clientCount: 0,
        activeCount: 0,
        totalRevenue: 0,
        totalDeliveryCost: 0,
        netProfit: 0,
        grossMarginPercent: 0,
        clientNames: [],
      });
    });

    // Aggregate client assignments
    clients.forEach((client) => {
      const pkgDef = getPackageByName(client.activePackage);
      const pkgKey = pkgDef ? pkgDef.name : (client.activePackage || "Custom Enterprise Retainer");

      if (!packageMetricsMap.has(pkgKey)) {
        packageMetricsMap.set(pkgKey, {
          id: "custom-" + Math.random().toString(36).slice(2, 7),
          name: pkgKey,
          category: "SPECIALIZED_RETAINER",
          standardPrice: Number(client.monthlyRetainer),
          targetMargin: 70.0,
          clientCount: 0,
          activeCount: 0,
          totalRevenue: 0,
          totalDeliveryCost: 0,
          netProfit: 0,
          grossMarginPercent: 0,
          clientNames: [],
        });
      }

      const m = packageMetricsMap.get(pkgKey)!;
      m.clientCount += 1;
      m.clientNames.push(client.name);

      if (client.status === "ACTIVE") {
        m.activeCount += 1;
        const retainer = Number(client.monthlyRetainer || 0);
        m.totalRevenue += retainer;

        const explicitCost = Number(client.estimatedDeliveryCost || 0);
        const cost = explicitCost > 0 ? explicitCost : (pkgDef ? pkgDef.estimatedDeliveryCost : Math.round(retainer * 0.3));
        m.totalDeliveryCost += cost;
      }
    });

    // Finalize margins for each package
    const packagePerformance = Array.from(packageMetricsMap.values()).map((p) => {
      const netProfit = p.totalRevenue - p.totalDeliveryCost;
      const margin = p.totalRevenue > 0 ? Math.round((netProfit / p.totalRevenue) * 1000) / 10 : p.targetMargin;
      return {
        ...p,
        netProfit,
        grossMarginPercent: margin,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue || b.clientCount - a.clientCount);

    // 4. Contract Renewals Tracking
    const upcomingRenewals: any[] = [];
    const overdueRenewals: any[] = [];

    clients.forEach((c) => {
      if (c.status !== "ACTIVE" && c.status !== "ONBOARDING") return;

      const renewalDate = c.contractRenewalDate ? new Date(c.contractRenewalDate) : null;
      if (!renewalDate) return;

      const diffDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const renewalItem = {
        id: c.id,
        name: c.name,
        brandName: c.brandName,
        activePackage: c.activePackage,
        monthlyRetainer: Number(c.monthlyRetainer),
        billingCycle: c.billingCycle,
        contractRenewalDate: c.contractRenewalDate,
        accountManagerName: c.accountManagerName,
        daysRemaining: diffDays,
      };

      if (diffDays < 0) {
        overdueRenewals.push(renewalItem);
      } else if (diffDays <= 60) {
        upcomingRenewals.push(renewalItem);
      }
    });

    upcomingRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining);
    overdueRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // 5. Payment & Invoicing Tracking
    const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
    const totalSettled = paidInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE" || (inv.status !== "PAID" && new Date(inv.dueDate) < now));
    const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        clientOverview: {
          totalClients,
          activeClients,
          onboardingClients,
          pausedClients,
          churnedClients,
        },
        revenueAnalytics: {
          totalMRR,
          totalARR,
          avgRetainer,
          totalDeliveryCosts,
          grossProfit,
          grossMarginPercent,
        },
        packagePerformance,
        renewals: {
          upcomingRenewals,
          upcomingRenewalsCount: upcomingRenewals.length,
          overdueRenewals,
          overdueRenewalsCount: overdueRenewals.length,
        },
        paymentTracking: {
          totalInvoiced,
          totalSettled,
          totalOverdue,
          overdueCount: overdueInvoices.length,
          settlementRate: totalInvoiced > 0 ? Math.round((totalSettled / totalInvoiced) * 100) : 100,
        },
        confidentialNotesCount: notesCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate package analytics report" },
      { status: 500 }
    );
  }
}
