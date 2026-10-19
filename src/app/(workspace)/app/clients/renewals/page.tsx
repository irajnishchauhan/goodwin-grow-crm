"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileText,
} from "lucide-react";

interface RenewalContract {
  id: string;
  clientName: string;
  brandName: string;
  activePackage: string;
  monthlyRetainer: number;
  contractEnd: string;
  daysRemaining: number;
  renewalProbability: number;
  upsellOpportunity: string;
  status: "CRITICAL" | "UPCOMING" | "HEALTHY";
}

export default function ContractsRenewalsPage() {
  const [contracts] = useState<RenewalContract[]>([
    {
      id: "1",
      clientName: "ZestPure Omnichannel D2C Nutrition",
      brandName: "ZestPure Wellness",
      activePackage: "Hyper-Growth Performance Retainer (Meta + Google)",
      monthlyRetainer: 280000,
      contractEnd: "2026-11-30",
      daysRemaining: 42,
      renewalProbability: 95,
      upsellOpportunity: "Upsell to Bharat Vernacular Influencer Engine (+₹1.5L/mo)",
      status: "UPCOMING",
    },
    {
      id: "2",
      clientName: "Sapna Washing Point",
      brandName: "Sapna Detailing & Car Spa",
      activePackage: "Growth Retainer (Social + Local SEO)",
      monthlyRetainer: 50000,
      contractEnd: "2026-12-31",
      daysRemaining: 73,
      renewalProbability: 90,
      upsellOpportunity: "Add Second Detailing Bay Meta Ad Campaign (+₹20k/mo)",
      status: "HEALTHY",
    },
    {
      id: "3",
      clientName: "Mahalaxmi Heritage Jewellers Group",
      brandName: "Mahalaxmi Jewels",
      activePackage: "Luxury Brand & High-Production Video Pod",
      monthlyRetainer: 375000,
      contractEnd: "2026-11-15",
      daysRemaining: 27,
      renewalProbability: 85,
      upsellOpportunity: "Wedding Season 4K Macro Ad Shoots (+₹2L one-off)",
      status: "CRITICAL",
    },
    {
      id: "4",
      clientName: "Maa Amba Foam & Furnishing",
      brandName: "Amba Living & Mattresses",
      activePackage: "Enterprise Creative & Meta Ads Retainer",
      monthlyRetainer: 100000,
      contractEnd: "2027-01-31",
      daysRemaining: 104,
      renewalProbability: 95,
      upsellOpportunity: "Omnichannel Google Search Ads Management",
      status: "HEALTHY",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contracts & Renewals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Retention & LTV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track annual agreement expiry dates, renewal probabilities, client retention, and retainer upsell opportunities.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>All Clients</span>
        </Link>
      </div>

      {/* Contract Cards */}
      <div className="grid grid-cols-1 gap-4">
        {contracts.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-base shrink-0">
                  {item.clientName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{item.clientName}</h3>
                    <span className="text-xs text-slate-400 font-medium">({item.brandName})</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span className="font-semibold text-emerald-700">
                      ₹{item.monthlyRetainer.toLocaleString("en-IN")} /month
                    </span>
                    <span>• Retainer: {item.activePackage}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Contract Expiry</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{item.contractEnd}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Days Remaining</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs ${
                        item.status === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : item.status === "UPCOMING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.daysRemaining} days
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Renewal Prob.</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    {item.renewalProbability}%
                  </div>
                </div>
              </div>
            </div>

            {/* Upsell Banner */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl border">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-700">Strategic Upsell:</span>
                <span className="text-slate-600">{item.upsellOpportunity}</span>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer self-start sm:self-auto">
                Prepare Renewal Agreement
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
