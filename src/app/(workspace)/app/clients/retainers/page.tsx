"use client";

import { useState } from "react";
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
} from "lucide-react";

interface RetainerPlan {
  id: string;
  name: string;
  price: number;
  cadence: string;
  description: string;
  deliverables: string[];
  activeClientsCount: number;
  highlighted?: boolean;
}

export default function RetainersPage() {
  const plans: RetainerPlan[] = [
    {
      id: "starter",
      name: "Starter Digital Presence & Local Leads",
      price: 25000,
      cadence: "per month",
      description: "Designed for local businesses and retail stores establishing consistent local footfall and social authority.",
      deliverables: [
        "8 Social Media Posts & Custom Creatives",
        "Google Business Profile (GBP) Local SEO Ranking",
        "Monthly Customer Review Management",
        "Dedicated Account Executive",
      ],
      activeClientsCount: 2,
    },
    {
      id: "growth",
      name: "Growth Retainer (Social + Local SEO)",
      price: 50000,
      cadence: "per month",
      description: "Ideal for fast-scaling local service businesses, auto care, salons, and regional retailers.",
      deliverables: [
        "12 High-Impact Instagram/FB Reels & Carousels",
        "Complete Local SEO Keyword Optimization (Top 3 Rank)",
        "Meta Lead Ads WhatsApp Funnel Setup",
        "Bi-weekly Strategy & Deliverables Review",
      ],
      activeClientsCount: 2,
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Creative & Meta Ads Retainer",
      price: 100000,
      cadence: "per month",
      description: "Full creative pod with senior visualizers, copywriters, and paid media campaign management.",
      deliverables: [
        "20 Brand Assets, 4K Video Ads & Product Shoots",
        "End-to-end Meta Ads Funnel (Instant Forms & WhatsApp)",
        "Custom Creative Review & Approval Dashboard",
        "Dedicated Creative Director & Account Manager",
      ],
      activeClientsCount: 1,
    },
    {
      id: "performance",
      name: "Goodwin Hyper-Growth Performance Retainer",
      price: 280000,
      cadence: "per month",
      description: "ROI-driven multi-channel media buying across Meta, Google Ads, YouTube, and LinkedIn.",
      deliverables: [
        "25+ Dynamic Video Ad Variations & Landing Pages",
        "Google Search, Performance Max & YouTube Ads",
        "Server-Side Conversions API & ROAS Optimization",
        "Guaranteed 3.5x+ ROAS Framework",
      ],
      activeClientsCount: 1,
    },
    {
      id: "corporate",
      name: "360° Corporate Brand Experience & Vernacular Engine",
      price: 450000,
      cadence: "per month",
      description: "Enterprise tier for national brands, fintechs, and venture-backed startups scaling across Bharat.",
      deliverables: [
        "30+ Multi-Format Content Assets (Reels, Long-Form, Blogs)",
        "Regional Vernacular Influencers (Hindi, Tamil, Marathi)",
        "24/7 Social Listening & Crisis ORM",
        "Custom Executive Reporting & C-Suite Reviews",
      ],
      activeClientsCount: 1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Service Packages & Retainers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Agency Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized retainer tiers, monthly deliverables, and recurring subscription revenue packages.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Assigned Clients</span>
        </Link>
      </div>

      {/* Retainer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl p-6 bg-white border transition-all flex flex-col justify-between ${
              plan.highlighted
                ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10"
                : "border-slate-200/80 shadow-xs hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                    plan.highlighted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {plan.name.split(" ")[0]} Tier
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {plan.activeClientsCount} Clients Active
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {plan.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">
                {plan.description}
              </p>

              <div className="mt-5 pb-5 border-b border-slate-100 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400 font-medium">/{plan.cadence}</span>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Monthly Deliverables Included:
                </div>
                {plan.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href={`/app/clients`}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  plan.highlighted
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <span>View Enrolled Clients</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
