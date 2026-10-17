import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  ArrowUpRight,
  PieChart,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) redirect("/login");

  const tenantId = tenantCtx.tenant.id;

  const [
    deals,
    leads,
    salesUsers,
    stages,
    dealsWonAgg,
    dealsLostAgg,
  ] = await Promise.all([
    prisma.deal.findMany({
      where: { tenantId },
      include: {
        stage: true,
        assignedOwner: { select: { fullName: true } },
      },
    }),
    prisma.lead.findMany({
      where: { tenantId },
      select: { status: true, source: true, score: true },
    }),
    prisma.tenantMembership.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            assignedDeals: {
              where: { tenantId },
              select: { value: true, status: true },
            },
          },
        },
      },
    }),
    prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { orderIndex: "asc" },
      include: {
        deals: { select: { value: true } },
      },
    }),
    prisma.deal.aggregate({
      where: { tenantId, status: "WON" },
      _sum: { value: true },
      _count: { id: true },
    }),
    prisma.deal.aggregate({
      where: { tenantId, status: "LOST" },
      _sum: { value: true },
      _count: { id: true },
    }),
  ]);

  const totalWonValue = Number(dealsWonAgg._sum.value || 0);
  const totalLostValue = Number(dealsLostAgg._sum.value || 0);
  const wonCount = dealsWonAgg._count.id;
  const lostCount = dealsLostAgg._count.id;
  const winRate = wonCount + lostCount > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : "0.0";

  // Calculate sales rep performance
  const repLeaderboard = salesUsers.map((member) => {
    const userDeals = member.user.assignedDeals || [];
    const won = userDeals.filter((d) => d.status === "WON");
    const open = userDeals.filter((d) => d.status === "OPEN");
    const totalWon = won.reduce((acc, d) => acc + Number(d.value), 0);
    const totalOpen = open.reduce((acc, d) => acc + Number(d.value), 0);

    return {
      id: member.user.id,
      name: member.user.fullName,
      wonDealsCount: won.length,
      wonValue: totalWon,
      openDealsCount: open.length,
      openValue: totalOpen,
    };
  }).sort((a, b) => b.wonValue - a.wonValue);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Sales Analytics & Reporting</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zoho and Salesforce-style pipeline metrics, win/loss analysis, and sales team leaderboards.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Total Revenue Won</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {formatCurrency(totalWonValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{wonCount} closed-won contracts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Opportunity Win Rate</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{winRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Based on closed deals</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Total Inquiries Captured</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{leads.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all marketing sources</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Pipeline Stages Monitored</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stages.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active funnel conversion steps</div>
        </div>
      </div>

      {/* Middle Row: Stage Breakdown & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Velocity & Volume */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Pipeline Stage Capital Distribution</h2>
            <span className="text-xs font-semibold text-slate-500">Live Funnel</span>
          </div>

          <div className="space-y-3.5">
            {stages.map((st) => {
              const stageSum = st.deals.reduce((acc, d) => acc + Number(d.value), 0);
              return (
                <div key={st.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{st.name}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stageSum)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(8, (st.deals.length * 20)))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Team Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Sales Representative Leaderboard</h2>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="divide-y divide-slate-100">
            {repLeaderboard.map((rep, idx) => (
              <div key={rep.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{rep.name}</div>
                    <div className="text-[11px] text-slate-500">{rep.openDealsCount} active deals in pipe</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-emerald-700 text-sm">
                    {formatCurrency(rep.wonValue)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Pipe: {formatCurrency(rep.openValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
