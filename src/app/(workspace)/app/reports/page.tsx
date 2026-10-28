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
    agencyClients,
    agencyInvoices,
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
    prisma.agencyClient.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        brandName: true,
        status: true,
        activePackage: true,
        monthlyRetainer: true,
        customPricing: true,
        estimatedDeliveryCost: true,
        contractStartDate: true,
        contractEndDate: true,
        billingCycle: true,
        accountManagerName: true,
      },
    }),
    prisma.agencyInvoice.findMany({
      where: { tenantId },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        client: { select: { brandName: true, name: true } },
      },
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

  // Agency Analytics computations
  const activeAgencyClients = agencyClients.filter((c) => c.status === "ACTIVE" || c.status === "ONBOARDING");
  const totalMRR = activeAgencyClients.reduce((sum, c) => sum + Number(c.monthlyRetainer || 0), 0);
  const totalARR = totalMRR * 12;

  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingRenewals = agencyClients.filter((c) => {
    if (!c.contractEndDate) return false;
    const end = new Date(c.contractEndDate);
    return end >= now && end <= next30Days;
  });

  const overdueInvoices = agencyInvoices.filter((inv) => {
    if (inv.status === "PAID") return false;
    const due = new Date(inv.dueDate);
    return due < now;
  });
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

  // Package-wise revenue breakdown
  const packageMap: Record<string, { count: number; mrr: number; clients: string[]; cost: number }> = {};
  for (const client of activeAgencyClients) {
    const pkgName = client.activePackage || "Custom Enterprise Retainer";
    if (!packageMap[pkgName]) {
      packageMap[pkgName] = { count: 0, mrr: 0, clients: [], cost: 0 };
    }
    const retainer = Number(client.monthlyRetainer || 0);
    const cost = client.estimatedDeliveryCost ? Number(client.estimatedDeliveryCost) : Math.round(retainer * 0.35);
    packageMap[pkgName].count += 1;
    packageMap[pkgName].mrr += retainer;
    packageMap[pkgName].cost += cost;
    packageMap[pkgName].clients.push(client.brandName || client.name);
  }

  const packageAnalytics = Object.entries(packageMap).map(([name, data]) => {
    const grossProfit = data.mrr - data.cost;
    const margin = data.mrr > 0 ? ((grossProfit / data.mrr) * 100).toFixed(1) : "0.0";
    return {
      name,
      count: data.count,
      mrr: data.mrr,
      cost: data.cost,
      grossProfit,
      margin: parseFloat(margin),
    };
  }).sort((a, b) => b.mrr - a.mrr);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Business & Pipeline Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic view of agency retainer MRR, contract renewals, package profitability, and sales conversion velocity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/app/profitability"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>Unit Economics</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <a
            href="/app/clients/renewals"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Renewals Desk</span>
          </a>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Retainer MRR / ARR</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {formatCurrency(totalMRR)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ARR: {formatCurrency(totalARR)} • {activeAgencyClients.length} active clients</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Sales Opportunity Win Rate</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{winRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{wonCount} closed-won contracts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Upcoming Renewals (30d)</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{upcomingRenewals.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Contracts requiring extension action</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Overdue Receivables</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{formatCurrency(totalOverdueAmount)}</div>
          <div className="text-[11px] text-rose-500 mt-1">{overdueInvoices.length} invoices overdue</div>
        </div>
      </div>

      {/* Package-Wise Revenue & Profitability Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Service Package Revenue & Profitability Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of standardized agency retainers, delivery cost economics, and gross profit margins.
            </p>
          </div>
          <a
            href="/app/clients/retainers"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Manage Standard Packages</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/60 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Package</th>
                <th className="py-3 px-4 text-center">Active Clients</th>
                <th className="py-3 px-4 text-right">Monthly Revenue</th>
                <th className="py-3 px-4 text-right">Delivery Cost</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packageAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No active packages configured yet.
                  </td>
                </tr>
              ) : (
                packageAnalytics.map((pkg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      {pkg.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {pkg.count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(pkg.mrr)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {formatCurrency(pkg.cost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(pkg.grossProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          pkg.margin >= 60
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : pkg.margin >= 45
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {pkg.margin}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
