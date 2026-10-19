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
    const now = new Date();
    const in72Hours = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const [
      clients,
      projects,
      upcomingPosts,
      adCampaigns,
      invoices,
      tasksCount,
      overdueFollowUps,
      pendingApprovals,
      approachingPosts,
      teamMembers,
    ] = await Promise.all([
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
      prisma.task.count({ where: { tenantId, status: { not: "COMPLETED" } } }),
      prisma.lead.findMany({
        where: {
          tenantId,
          nextFollowUp: { lt: now },
          status: { notIn: ["CONVERTED", "LOST"] },
        },
        take: 4,
        orderBy: { nextFollowUp: "asc" },
        include: { assignedOwner: true, client: true },
      }),
      prisma.creativeAsset.findMany({
        where: {
          tenantId,
          reviewStatus: { in: ["INTERNAL_REVIEW", "CLIENT_REVIEW", "CHANGES_REQUESTED"] },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      prisma.contentPost.findMany({
        where: {
          tenantId,
          scheduledDate: { gte: now, lte: in72Hours },
          status: { not: "PUBLISHED" },
        },
        take: 4,
        orderBy: { scheduledDate: "asc" },
        include: { client: true },
      }),
      prisma.user.findMany({
        where: {
          memberships: { some: { tenantId } },
        },
        take: 6,
        include: {
          assignedTasks: {
            where: { tenantId, status: { not: "COMPLETED" } },
          },
          memberships: {
            where: { tenantId },
            include: { roles: { include: { role: true } } },
          },
        },
      }),
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
              Welcome back, {tenantCtx.user.fullName}. Live client workspaces, monthly deliverable progress, and team workload.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/clients/portal"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
            >
              Client Portal
            </Link>
            <Link
              href="/app/creative-approvals"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
            >
              Creative Approvals
            </Link>
          </div>
        </div>

        {/* Agency Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
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

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Deliverables Completed
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {completionRate}% Done
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {totalCompleted} completed / {totalPlanned} planned
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {pendingApprovals.length} Assets
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Awaiting internal or client review
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Follow-ups
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {overdueFollowUps.length} Leads
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              Follow-up scheduled time passed
            </div>
          </div>
        </div>

        {/* 1. Monthly Deliverables Completed Widget (Per-Client Progress Bars) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Monthly Deliverables Completed by Client Workspace</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live delivery progress tracking against contracted client retainer deliverables
              </p>
            </div>
            <Link
              href="/app/clients"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All Workspaces</span>
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

        {/* 2-Column Grid: Overdue Follow-ups & Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Follow-ups Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Overdue Follow-ups ({overdueFollowUps.length})</span>
              </h3>
              <Link href="/app/leads" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                View All Leads
              </Link>
            </div>

            {overdueFollowUps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No overdue lead follow-ups. All agent follow-ups are on schedule!
              </div>
            ) : (
              <div className="space-y-3">
                {overdueFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {lead.companyName || lead.serviceRequired || "Prospect Lead"}
                      </div>
                      <div className="text-[10px] text-rose-700 font-semibold mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Scheduled: {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "Past due"}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-600 block">
                        Owner: {lead.assignedOwner?.fullName || "Unassigned"}
                      </span>
                      <Link
                        href="/app/leads"
                        className="inline-block mt-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition"
                      >
                        Follow Up Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Approvals Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Creative Approvals ({pendingApprovals.length})</span>
              </h3>
              <Link href="/app/creative-approvals" className="text-xs font-semibold text-emerald-700">
                Approvals Board
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No creatives currently awaiting approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-emerald-700 truncate">
                        {asset.client?.name || "Client"}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {asset.title} (v{asset.version || 1})
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Submitted: {formatDate(asset.createdAt)}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 block mb-1">
                        {asset.reviewStatus}
                      </span>
                      <Link
                        href="/app/creative-approvals"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        Review Asset →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Approaching Deadlines & Team Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approaching Deadlines Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Approaching Publishing Deadlines (Next 72h)</span>
              </h3>
              <Link href="/app/content-calendar" className="text-xs font-semibold text-emerald-700">
                Full Calendar
              </Link>
            </div>

            {approachingPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No deliverables due in the next 72 hours.
              </div>
            ) : (
              <div className="space-y-3">
                {approachingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-[10px] font-bold text-emerald-700 truncate">
                        {post.client?.name} • {post.platform}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {post.title}
                      </div>
                      <div className="text-[10px] text-indigo-700 font-semibold mt-1">
                        Scheduled: {post.scheduledDate ? formatDate(post.scheduledDate) : "—"}
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {post.postType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Workload Distribution Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-600" />
                <span>Team Workload Distribution</span>
              </h3>
              <Link href="/app/tasks" className="text-xs font-semibold text-emerald-700">
                Tasks Queue
              </Link>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => {
                const activeCount = member.assignedTasks?.length || 0;
                const roleName = member.memberships[0]?.roles[0]?.role?.name || "Team Member";
                const capacityPercent = Math.min(100, activeCount * 25);

                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{member.fullName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200/80 text-slate-700">
                          {roleName}
                        </span>
                      </div>
                      <span className="font-bold text-purple-700 text-xs">
                        {activeCount} active task{activeCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          capacityPercent > 75
                            ? "bg-rose-500"
                            : capacityPercent > 50
                            ? "bg-amber-500"
                            : "bg-purple-600"
                        }`}
                        style={{ width: `${Math.max(10, capacityPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
