"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Users2,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Share2,
  Target,
  Search,
} from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  clientName: string;
  channels: string[];
  budget: number;
  spent: number;
  leadsGenerated: number;
  roas: string;
  status: "ACTIVE" | "COMPLETED" | "PLANNING";
  dates: string;
}

export default function CampaignsPage() {
  const [campaigns] = useState<CampaignItem[]>([
    {
      id: "1",
      name: "Diwali 2026 Vehicle Detailing & Paint Protection Drive",
      clientName: "Sapna Washing Point",
      channels: ["Meta Ads", "Instagram Reels", "Local SEO & GBP", "WhatsApp Broadcast"],
      budget: 25000,
      spent: 14200,
      leadsGenerated: 142,
      roas: "4.8x",
      status: "ACTIVE",
      dates: "Oct 15 - Nov 05, 2026",
    },
    {
      id: "2",
      name: "Diwali Home Makeover & Ortho Mattress Launch",
      clientName: "Maa Amba Foam & Furnishing",
      channels: ["Meta Instant Leads", "Catalog Carousel", "High-Production Video Shoots"],
      budget: 65000,
      spent: 42000,
      leadsGenerated: 218,
      roas: "5.4x",
      status: "ACTIVE",
      dates: "Oct 10 - Nov 15, 2026",
    },
    {
      id: "3",
      name: "Q4 D2C Grass-Fed Whey Protein Scaled Acquisition",
      clientName: "ZestPure Omnichannel D2C Nutrition",
      channels: ["Google Search Ads", "Meta Conversion API", "Fitness Creator Whitelisting"],
      budget: 280000,
      spent: 184000,
      leadsGenerated: 720,
      roas: "4.2x",
      status: "ACTIVE",
      dates: "Oct 01 - Dec 31, 2026",
    },
    {
      id: "4",
      name: "Tier-2 Bharat Vernacular SIP Awareness Drive",
      clientName: "FinEdge Neo-Banking & Wealth Technologies",
      channels: ["Regional Vernacular Creators (Hindi & Tamil)", "YouTube Shorts", "PR News"],
      budget: 450000,
      spent: 290000,
      leadsGenerated: 1840,
      roas: "3.9x",
      status: "ACTIVE",
      dates: "Sep 15 - Nov 30, 2026",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Integrated Campaign Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Cross-Channel Pods
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Orchestrate omnichannel client campaigns uniting paid ads, creative storytelling, local search, and creator partnerships.
          </p>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{c.clientName}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {c.name}
              </h3>

              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{c.dates}</span>
              </div>

              {/* Channels Tag Cloud */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.channels.map((ch, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200/60"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Spent</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    ₹{c.spent.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Leads / Conv.</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    {c.leadsGenerated}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">ROAS</div>
                  <div className="text-xs font-black text-purple-700 mt-0.5">
                    {c.roas}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
