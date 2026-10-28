"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Check,
  TrendingUp,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Percent,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  FileText,
} from "lucide-react";
import { SERVICE_PACKAGES, ADD_ON_SERVICES, ServicePackage, calculatePackageProfitability } from "@/lib/agency/packages";

export default function RetainersPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<ServicePackage | null>(null);

  useEffect(() => {
    fetch("/api/agency/clients")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setClients(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getEnrolledClients(plan: ServicePackage): any[] {
    return clients.filter((c) => {
      const matchName = c.activePackage?.toLowerCase().includes(plan.name.slice(0, 10).toLowerCase());
      const matchPrice = Number(c.monthlyRetainer) === plan.price;
      return c.status === "ACTIVE" && (matchName || matchPrice);
    });
  }

  // Calculate live financial summary across all active clients
  const activeClients = clients.filter((c) => c.status === "ACTIVE");
  const totalMRR = activeClients.reduce((acc, c) => acc + Number(c.monthlyRetainer || 0), 0);
  const totalARR = totalMRR * 12;

  // Filtered packages
  const filteredPackages = SERVICE_PACKAGES.filter((p) => {
    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "CORE") return p.category === "CORE_RETAINER";
    if (categoryFilter === "SPECIALIZED") return p.category === "SPECIALIZED_RETAINER";
    if (categoryFilter === "DEVELOPMENT") return p.category === "DEVELOPMENT" || p.category === "ENTERPRISE";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Service Packages & Standardized Retainers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              10 Standardized Tiers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized scope, deliverables, delivery costs, minimum contract terms, target gross margins, and optional add-on services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/clients"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Building2 className="w-4 h-4" />
            <span>Assign Package to Client</span>
          </Link>
        </div>
      </div>

      {/* Top Package & Revenue Analytics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Retainer MRR
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalMRR.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            ARR Run Rate: ₹{(totalARR / 100000).toFixed(1)}L
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Retainers Enrolled
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeClients.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Across standardized service plans
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Retainer Value
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{activeClients.length > 0 ? Math.round(totalMRR / activeClients.length).toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            Per client monthly contract
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Target Delivery Margin
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            71.4%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Healthy unit economics benchmark
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/70 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "All Service Packages (10)" },
            { id: "CORE", label: "Core All-in-One Retainers (5)" },
            { id: "SPECIALIZED", label: "Specialized / Ads & SEO Only (3)" },
            { id: "DEVELOPMENT", label: "Web Design & Enterprise (2)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                categoryFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium px-2">
          Pricing standardized in INR (excl. 18% GST)
        </div>
      </div>

      {/* Service Packages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((plan) => {
          const enrolled = getEnrolledClients(plan);
          const enrolledCount = enrolled.length;
          const packageMRR = enrolled.reduce((acc, c) => acc + Number(c.monthlyRetainer || plan.price), 0);

          return (
            <div
              key={plan.id}
              className={`rounded-3xl border bg-white flex flex-col justify-between transition relative overflow-hidden shadow-xs hover:shadow-md ${
                plan.isPopular
                  ? "border-emerald-500 ring-2 ring-emerald-500/10"
                  : "border-slate-200"
              }`}
            >
              {plan.isPopular && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-4 text-center">
                  Most Popular Retainer Choice
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {plan.category === "CORE_RETAINER"
                        ? "Core Tier"
                        : plan.category === "SPECIALIZED_RETAINER"
                        ? "Specialized"
                        : plan.category === "DEVELOPMENT"
                        ? "Development"
                        : "Enterprise"}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                      {plan.name}
                    </h3>
                  </div>

                  {enrolledCount > 0 && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {enrolledCount} Active
                    </span>
                  )}
                </div>

                {/* Price & Delivery Cost */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/{plan.cadence}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">
                      Delivery Cost: <strong className="text-slate-800">₹{plan.estimatedDeliveryCost.toLocaleString("en-IN")}</strong>
                    </span>
                    <span className="font-bold text-emerald-700">
                      {plan.targetGrossMarginPercent}% Margin
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {plan.description}
                </p>

                {/* Deliverables Checklist */}
                <div>
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Standard Deliverables:
                  </div>
                  <ul className="space-y-2 text-xs">
                    {plan.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contract Terms */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Contract Commitment & Terms:</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    {plan.contractTerms.summary}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Package MRR</div>
                  <div className="text-xs font-bold text-slate-900">
                    ₹{packageMRR.toLocaleString("en-IN")} /mo
                  </div>
                </div>

                <Link
                  href={`/app/clients`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
                >
                  <span>View Clients</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standardized Add-On Services Catalog */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Standardized Optional Add-On Services
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                High Margin Upsells
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Modular specialized add-ons that can be attached to any client contract for incremental revenue.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADD_ON_SERVICES.map((addon) => (
            <div
              key={addon.id}
              className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/80 hover:border-purple-300 transition space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-purple-950">{addon.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 shrink-0">
                    {addon.pricingType === "ONE_TIME" ? "One-Time" : "Monthly"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {addon.description}
                </p>
              </div>

              <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Standard Price</span>
                  <span className="text-sm font-black text-purple-900">
                    ₹{addon.price.toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 font-semibold bg-white px-2 py-1 rounded-lg border border-purple-100">
                  Deliverable scope defined
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
