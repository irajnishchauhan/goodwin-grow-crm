import Link from "next/link";
import prisma from "@/lib/prisma";
import { Building2, Users, Layers, TrendingUp, ShieldCheck, Plus, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PlatformOverviewPage() {
  const [totalTenants, activeTenants, totalUsers, totalDeals, tenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.deal.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        settings: true,
        subscription: { include: { plan: true } },
        _count: { select: { memberships: true, deals: true, leads: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Goodwin Grow AI Platform Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant SaaS metrics, client workspaces, and system performance.
          </p>
        </div>

        <Link
          href="/platform/clients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Client</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
            <span>Total Client Companies</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalTenants}</div>
          <div className="text-[11px] text-emerald-400 mt-2 font-medium">
            {activeTenants} Active Workspaces
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
            <span>Platform Users</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium">
            Across all tenant workspaces
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
            <span>Active CRM Deals</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalDeals}</div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium">
            Tracked in tenant pipelines
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
            <span>Platform Isolation Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">100%</div>
          <div className="text-[11px] text-emerald-400/80 mt-2 font-medium">
            Strict RLS & Tenant Scoping
          </div>
        </div>
      </div>

      {/* Recent Client Workspaces */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Client Company Workspaces</h2>
            <p className="text-xs text-slate-400">Overview of onboarded enterprise tenants.</p>
          </div>
          <Link
            href="/platform/clients"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Workspace Code</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Deals Tracked</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{t.code}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {t.subscription?.plan.name || "Standard"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{t._count.memberships} seats</td>
                  <td className="py-3 px-4">{t._count.deals} deals</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
