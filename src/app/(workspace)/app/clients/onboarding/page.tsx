"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Key,
  FolderOpen,
  Calendar,
  Building2,
  ExternalLink,
} from "lucide-react";

interface OnboardingItem {
  id: string;
  clientName: string;
  brandName: string;
  package: string;
  startDate: string;
  steps: {
    agreement: boolean;
    brandAssets: boolean;
    adAccess: boolean;
    servicePlan: boolean;
    kickoffCall: boolean;
  };
  accountManager: string;
}

export default function ClientOnboardingPage() {
  const [items, setItems] = useState<OnboardingItem[]>([
    {
      id: "1",
      clientName: "Sapna Washing Point",
      brandName: "Sapna Detailing & Car Spa",
      package: "Growth Retainer (Social + Local SEO)",
      startDate: "2026-10-01",
      steps: {
        agreement: true,
        brandAssets: true,
        adAccess: true,
        servicePlan: true,
        kickoffCall: true,
      },
      accountManager: "Kunal Sharma",
    },
    {
      id: "2",
      clientName: "Maa Amba Foam & Furnishing",
      brandName: "Amba Living & Mattresses",
      package: "Enterprise Creative & Meta Ads Retainer",
      startDate: "2026-10-05",
      steps: {
        agreement: true,
        brandAssets: true,
        adAccess: true,
        servicePlan: true,
        kickoffCall: true,
      },
      accountManager: "Ansh Chourasiya",
    },
    {
      id: "3",
      clientName: "ZestPure Omnichannel D2C Nutrition",
      brandName: "ZestPure Wellness",
      package: "Hyper-Growth Performance Retainer (Meta + Google)",
      startDate: "2026-10-08",
      steps: {
        agreement: true,
        brandAssets: true,
        adAccess: true,
        servicePlan: true,
        kickoffCall: true,
      },
      accountManager: "Rohit Kapoor",
    },
    {
      id: "4",
      clientName: "FinEdge Neo-Banking & Wealth Technologies",
      brandName: "FinEdge App",
      package: "360° Corporate Brand Experience & Influencers",
      startDate: "2026-10-15",
      steps: {
        agreement: true,
        brandAssets: true,
        adAccess: false,
        servicePlan: true,
        kickoffCall: false,
      },
      accountManager: "Ansh Chourasiya",
    },
  ]);

  function toggleStep(clientId: string, stepKey: keyof OnboardingItem["steps"]) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === clientId) {
          return {
            ...item,
            steps: {
              ...item.steps,
              [stepKey]: !item.steps[stepKey],
            },
          };
        }
        return item;
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Client Onboarding Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              4-Step Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Systematic onboarding pipeline: Agreement &rarr; Brand Assets &rarr; Ad Access &rarr; Service Plan &rarr; Launch.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>View All Clients</span>
        </Link>
      </div>

      {/* Onboarding Overview Matrix */}
      <div className="grid grid-cols-1 gap-4">
        {items.map((client) => {
          const completedCount = Object.values(client.steps).filter(Boolean).length;
          const totalCount = Object.values(client.steps).length;
          const percent = Math.round((completedCount / totalCount) * 100);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {client.clientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{client.clientName}</h3>
                      <span className="text-xs text-slate-400 font-medium">({client.brandName})</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="font-medium text-emerald-700">{client.package}</span>
                      <span>• AM: {client.accountManager}</span>
                      <span>• Started: {client.startDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">Progress</div>
                    <div className="text-sm font-bold text-slate-900">{percent}% Complete</div>
                  </div>
                  <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {percent === 100 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Fully Onboarded
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Checklist Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => toggleStep(client.id, "agreement")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    client.steps.agreement
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      client.steps.agreement ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">1. Agreement</div>
                    <div className="text-[10px] text-slate-400">Signed & Deposited</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleStep(client.id, "brandAssets")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    client.steps.brandAssets
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      client.steps.brandAssets ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">2. Brand Assets</div>
                    <div className="text-[10px] text-slate-400">Logos & Guidelines</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleStep(client.id, "adAccess")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    client.steps.adAccess
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      client.steps.adAccess ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">3. Ad Access</div>
                    <div className="text-[10px] text-slate-400">Meta & Google BM</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleStep(client.id, "servicePlan")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    client.steps.servicePlan
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      client.steps.servicePlan ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">4. Service Plan</div>
                    <div className="text-[10px] text-slate-400">Month 1 Deliverables</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleStep(client.id, "kickoffCall")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    client.steps.kickoffCall
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      client.steps.kickoffCall ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold">5. Kickoff Call</div>
                    <div className="text-[10px] text-slate-400">Team Introduction</div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
