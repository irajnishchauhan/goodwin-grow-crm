import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { Settings, Users, Shield, Building2, Mail, Key, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantCtx.tenant.id },
    include: {
      settings: true,
      subscription: { include: { plan: true } },
      memberships: {
        include: {
          user: true,
          roles: { include: { role: true } },
        },
      },
      invitations: {
        include: { role: true },
      },
    },
  });

  if (!tenant) redirect("/login");

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure corporate CRM parameters, team access permissions, and subscription limits.
        </p>
      </div>

      {/* Company Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Organization Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-semibold mb-1">Company Name</div>
            <div className="text-slate-900 font-bold text-sm">{tenant.name}</div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Workspace Code</div>
            <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
              {tenant.code}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Default Currency</div>
            <div className="text-slate-900 font-medium">{tenant.settings?.currency || "INR (₹)"}</div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Timezone</div>
            <div className="text-slate-900 font-medium">{tenant.settings?.timezone || "Asia/Kolkata"}</div>
          </div>
        </div>
      </div>

      {/* Subscription & Seat Allocation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>SaaS Subscription & Entitlements</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
            {tenant.subscription?.plan.name || "Growth"} Tier
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold mb-1">Seat Usage</div>
            <div className="text-xl font-extrabold text-slate-900">
              {tenant.memberships.length} / {tenant.settings?.seatLimit || 10}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Active team seats</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold mb-1">Status</div>
            <div className="text-xl font-extrabold text-emerald-600">
              {tenant.subscription?.status || "ACTIVE"}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Goodwin Grow SaaS</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold mb-1">Next Billing Date</div>
            <div className="text-xl font-extrabold text-slate-900">
              {formatDate(tenant.subscription?.currentPeriodEnd)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Auto-renews</div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Workspace Team Members</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {tenant.memberships.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {m.user.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{m.user.fullName}</div>
                  <div className="text-[11px] text-slate-500">{m.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {m.roles[0]?.role.name || (m.isOwner ? "Company Owner" : "Member")}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
