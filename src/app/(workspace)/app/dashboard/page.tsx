import { redirect } from "next/navigation";
import Link from "next/link";
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
  Building2,
  DollarSign,
  Share2,
  Target,
  Layers,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenantId = tenantCtx.tenant.id;
  const isAgency = tenantCtx.tenant.code === "goodwin-grow-ai";

  // If in Goodwin Grow AI workspace, load Marketing Agency OS data
  if (isAgency) {
    const [clients, projects, upcomingPosts, adCampaigns, invoices, tasksCount] = await Promise.all([
      prisma.agencyClient.findMany({
        where: { tenantId },
        orderBy: { monthlyRetainer: "desc" },
      }),
      prisma.agencyProject.findMany({
        where: { tenantId },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      prisma.contentPost.findMany({
        where: { tenantId },
        take: 4,
        orderBy: { scheduledDate: "asc" },
        include: { client: true },
      }),
      prisma.adCampaign.findMany({ where: { tenantId } }),
      prisma.agencyInvoice.findMany({ where: { tenantId } }),
      prisma.agencyTask.count({ where: { tenantId } }),
    ]);

    const totalRetainerMRR = clients.reduce((acc, c) => acc + Number(c.monthlyRetainer), 0);
    const totalPlanned = clients.reduce((acc, c) => acc + (c.postsPlanned || 0), 0);
    const totalCompleted = clients.reduce((acc, c) => acc + (c.postsCompleted || 0), 0);
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 72;
    const totalAdSpend = adCampaigns.reduce((acc, ad) => acc + Number(ad.spent), 0);
    const totalLeads = adCampaigns.reduce((acc, ad) => acc + ad.leadsCount, 0);

    return (
      <div className="space-y-6">
        {/* Agency Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md w-fit mb-1 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Goodwin Grow AI • Marketing Agency Operating System</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Agency Executive Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome back, {tenantCtx.user.fullName}. Live client workspaces, monthly deliverable progress, and campaign analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/clients"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
            >
              + Client 360° View
            </Link>
            <Link
              href="/app/content-calendar"
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
            >
              Social Calendar
            </Link>
          </div>
        </div>

        {/* Agency Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Retainer MRR
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(totalRetainerMRR / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {clients.length} active marketing clients
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Deliverables
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {completionRate}% Done
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {totalCompleted} completed / {totalPlanned} planned
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Paid Ad Spend
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              ₹{totalAdSpend.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              {totalLeads} leads captured (Meta & Google)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Live Delivery Tasks
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {tasksCount} Tasks
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">
              Across 7 delivery stages
            </div>
          </div>
        </div>

        {/* Client Deliverables Progress (From PRD & User Prompt) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Client Workspace Deliverable Status
              </h2>
              <p className="text-xs text-slate-500">
                Live deliverable progress calculated from completed work pods
              </p>
            </div>
            <Link
              href="/app/clients"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All 360° Workspaces</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clients.slice(0, 4).map((c) => {
              const rate =
                c.postsPlanned > 0 ? Math.round((c.postsCompleted / c.postsPlanned) * 100) : 0;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate">{c.name}</span>
                    <span className="font-black text-emerald-700">{rate}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 truncate">
                    {c.brandName || c.industry}
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] bg-white p-2 rounded-xl border border-slate-200/60">
                    <div>
                      <div className="font-bold text-slate-800">{c.postsPlanned}</div>
                      <div className="text-slate-400">Planned</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">{c.postsCompleted}</div>
                      <div className="text-slate-400">Done</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-700">
                        {Math.max(c.postsPlanned - c.postsCompleted, 0)}
                      </div>
                      <div className="text-slate-400">Pending</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid: Active Projects & Content Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Active Campaign Projects</span>
              </h3>
              <Link href="/app/projects" className="text-xs font-semibold text-emerald-700">
                See All
              </Link>
            </div>

            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-xs font-bold text-emerald-600">{p.progressPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.client?.name || "Client"}</span>
                    <span>Lead: {p.assigneeName || "Kunal"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Posts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Scheduled Content Posts (October 2026)</span>
              </h3>
              <Link href="/app/content-calendar" className="text-xs font-semibold text-emerald-700">
                Calendar
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-[10px] font-bold text-emerald-700 truncate">
                      {post.client?.name} • {post.platform}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {post.title}
                    </div>
                    {post.festivalOrEvent && (
                      <span className="inline-block text-[9px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                        {post.festivalOrEvent}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Default / Standard Battery Industry Sales CRM Dashboard
  // -------------------------------------------------------------
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
          <Link
            href="/app/leads"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
          >
            + Create New Lead
          </Link>
          <Link
            href="/app/deals"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            View Pipeline
          </Link>
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
            <span>{todaysTasks}</span>
            <span className="text-xs font-semibold text-slate-400">Due Today</span>
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            {overdueTasks} overdue tasks needing attention
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pipeline Breakdown & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Funnel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sales Pipeline Breakdown</h2>
              <p className="text-xs text-slate-500">Distribution of active deals across pipeline stages</p>
            </div>
            <Link href="/app/deals" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Open Kanban &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {stages.map((stage) => {
              const maxDeals = Math.max(...stages.map((s) => s._count.deals), 1);
              const percentage = Math.round((stage._count.deals / maxDeals) * 100);

              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{stage.name}</span>
                    <span className="font-bold text-slate-900">
                      {stage._count.deals} {stage._count.deals === 1 ? "deal" : "deals"}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Lead Attribution Sources</h2>
          <p className="text-xs text-slate-500 mb-4">Where your highest-converting inquiries originate</p>

          <div className="space-y-3">
            {leadSources.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No source data yet</div>
            ) : (
              leadSources.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">
                    {item.source || "Direct / Website"}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {item._count.id} leads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
