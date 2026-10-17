import prisma from "@/lib/prisma";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function PlatformPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { monthlyPrice: "asc" },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans & Entitlements</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure commercial tiers, seat quotas, and module feature flags.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const features = (p.features as any) || {};
          return (
            <div
              key={p.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              {p.code === "professional" && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Popular
                </div>
              )}

              <div>
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {formatCurrency(Number(p.monthlyPrice))}
                  <span className="text-xs font-normal text-slate-400"> /mo</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Billed annually at {formatCurrency(Number(p.annualPrice))}
                </div>

                <div className="mt-5 pt-5 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Up to {p.seatLimit} user seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Unlimited leads & contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Visual Kanban pipelines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Sales quotations engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {features.automations ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="w-4 h-4 text-slate-600 font-bold text-center">—</span>
                    )}
                    <span className={features.automations ? "text-slate-200" : "text-slate-500"}>
                      Workflow Automations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {features.advanced_reporting ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="w-4 h-4 text-slate-600 font-bold text-center">—</span>
                    )}
                    <span className={features.advanced_reporting ? "text-slate-200" : "text-slate-500"}>
                      Advanced Analytics & Export
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                Active Subscribers: <span className="text-white font-bold">{p._count.subscriptions} companies</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
