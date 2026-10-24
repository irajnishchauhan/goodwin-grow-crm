"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";

interface AdCampaign {
  id: string;
  campaignName: string;
  platform?: string;
  objective?: string;
  budget: number;
  spent: number;
  leadsCount: number;
  roas: number;
  status: string;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/ads");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCampaigns(data.data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

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

        <div className="flex items-center gap-2">
          <Link
            href="/app/meta-ads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Launch Meta Campaign</span>
          </Link>
          <Link
            href="/app/google-ads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Launch Google Campaign</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading active campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Active Ad Campaigns</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You currently have no ad campaigns running. Launch your first Meta Ads or Google Search campaign to start tracking leads and ROAS.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link
              href="/app/meta-ads"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              + Create Meta Ad Campaign
            </Link>
            <Link
              href="/app/google-ads"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition"
            >
              + Create Google Ad Campaign
            </Link>
          </div>
        </div>
      ) : (
        /* Campaign Cards */
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
                    <span>{c.client?.name || c.client?.brandName || "General Agency Campaign"}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {c.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {c.campaignName}
                </h3>

                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{c.objective || "Performance Campaign"}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                    {c.platform || "Paid Media"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-100">
                    Target ROAS: {c.roas}x
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Spent</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      ₹{Number(c.spent).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Leads / Conv.</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {c.leadsCount}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="text-[10px] font-bold text-purple-600 uppercase">ROAS</div>
                    <div className="text-xs font-black text-purple-700 mt-0.5">
                      {c.roas}x
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
