import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active company session required" },
      { status: 401 }
    );
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Client users cannot access agency dashboard reports" },
      { status: 403 }
    );
  }

  const tenantId = tenantCtx.tenant.id;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    openDeals,
    wonDeals,
    lostDeals,
    dealsAgg,
    allDeals,
    todaysTasks,
    overdueTasks,
    leadSources,
    recentActivities,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId, status: "NEW" } }),
    prisma.lead.count({ where: { tenantId, status: "QUALIFIED" } }),
    prisma.lead.count({ where: { tenantId, status: "CONVERTED" } }),
    prisma.deal.count({ where: { tenantId, status: "OPEN" } }),
    prisma.deal.count({ where: { tenantId, status: "WON" } }),
    prisma.deal.count({ where: { tenantId, status: "LOST" } }),
    prisma.deal.aggregate({
      where: { tenantId, status: "OPEN" },
      _sum: { value: true },
    }),
    prisma.deal.findMany({
      where: { tenantId, status: "OPEN" },
      select: { value: true, probability: true },
    }),
    prisma.task.count({
      where: {
        tenantId,
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: { not: "COMPLETED" },
      },
    }),
    prisma.task.count({
      where: {
        tenantId,
        dueDate: { lt: startOfToday },
        status: { not: "COMPLETED" },
      },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.activity.findMany({
      where: { tenantId },
      orderBy: { occurredAt: "desc" },
      take: 8,
      include: {
        performedBy: {
          select: { fullName: true, email: true },
        },
      },
    }),
  ]);

  const pipelineValue = Number(dealsAgg._sum.value || 0);

  // Expected revenue = sum(value * probability / 100)
  const expectedRevenue = allDeals.reduce((acc, deal) => {
    return acc + Number(deal.value) * (deal.probability / 100);
  }, 0);

  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    success: true,
    data: {
      tenant: tenantCtx.tenant,
      metrics: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        openDeals,
        wonDeals,
        lostDeals,
        pipelineValue,
        expectedRevenue: Math.round(expectedRevenue),
        conversionRate,
        todaysTasks,
        overdueTasks,
      },
      leadSources: leadSources.map((ls) => ({
        source: ls.source || "Unspecified",
        count: ls._count.id,
      })),
      recentActivities: recentActivities.map((act) => ({
        id: act.id,
        type: act.type,
        title: act.title,
        description: act.description,
        performedBy: act.performedBy.fullName,
        occurredAt: act.occurredAt,
      })),
    },
  });
}
