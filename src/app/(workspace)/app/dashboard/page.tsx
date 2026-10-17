import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import {
  TrendingUp,
  Users2,
  Kanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Phone,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
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
    stages,
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
      take: 6,
      include: {
        performedBy: { select: { fullName: true } },
      },
    }),
    prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { orderIndex: "asc" },
      include: {
        _count: { select: { deals: true } },
      },
    }),
  ]);

  const pipelineValue = Number(dealsAgg._sum.value || 0);

  const expectedRevenue = allDeals.reduce((acc, deal) => {
    return acc + Number(deal.value) * (deal.probability / 100);
  }, 0);

  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md w-fit mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{tenantCtx.tenant.name} CRM Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {tenantCtx.user.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline analytics, lead conversion metrics, and daily sales tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/app/leads"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
          >
            + Create New Lead
          </a>
          <a
            href="/app/deals"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            View Pipeline
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Pipeline Value (Open Deals)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(pipelineValue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {openDeals} deals currently in active pipeline
          </div>
        </div>

        {/* Expected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Weighted Expected Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(Math.round(expectedRevenue))}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Calculated via win-probability modeling
          </div>
        </div>

        {/* Total Leads & Conversion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Total Leads & Conversion</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-2">
            <span>{totalLeads}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {conversionRate}% Won
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {newLeads} new • {qualifiedLeads} qualified
          </div>
        </div>

        {/* Tasks & Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Tasks & Follow-ups</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-2">
            <span>{todaysTasks} Due Today</span>
            {overdueTasks > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {overdueTasks} Overdue
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Action items requiring attention
          </div>
        </div>
      </div>

      {/* Middle Row: Pipeline Stages Funnel & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Funnel Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pipeline Stages Funnel</h2>
              <p className="text-xs text-slate-500">Distribution of active deals across sales stages.</p>
            </div>
            <a
              href="/app/deals"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Kanban Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            {stages.map((st) => (
              <div key={st.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{st.name}</span>
                  <span className="font-bold text-slate-900">
                    {st._count.deals} {st._count.deals === 1 ? "deal" : "deals"} ({st.winProbability}% win prob)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(5, (st._count.deals / (openDeals || 1)) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Acquisition Sources */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Lead Sources</h2>
            <p className="text-xs text-slate-500 mb-4">Origin of incoming sales inquiries.</p>

            <div className="space-y-3">
              {leadSources.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">No leads captured yet</div>
              ) : (
                leadSources.map((ls) => (
                  <div
                    key={ls.source || "Unknown"}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="text-xs font-semibold text-slate-700">
                      {ls.source || "Direct / Unspecified"}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      {ls._count.id} leads
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <a
              href="/app/leads"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage all leads &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Sales Activities</h2>
            <p className="text-xs text-slate-500">Timeline of logged client interactions and tasks.</p>
          </div>
          <a
            href="/app/activities"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Activity Feed</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No activities logged yet.</div>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === "CALL" && <Phone className="w-4 h-4" />}
                    {act.type === "EMAIL" && <Mail className="w-4 h-4" />}
                    {act.type === "MEETING" && <Calendar className="w-4 h-4" />}
                    {(act.type === "NOTE" || act.type === "TASK") && <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{act.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      By {act.performedBy.fullName}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {formatDate(act.occurredAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
