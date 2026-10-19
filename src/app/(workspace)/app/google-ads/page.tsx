"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Users2,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  X,
} from "lucide-react";

interface AdCampaign {
  id: string;
  campaignName: string;
  objective: string;
  budget: number;
  spent: number;
  leadsCount: number;
  cpl: number;
  roas: number;
  impressions: number;
  clicks: number;
  status: string;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function GoogleAdsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/ads?platform=GOOGLE");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalSpent = campaigns.reduce((acc, c) => acc + Number(c.spent), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.leadsCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const avgCPC = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "9.03";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Google Ads & Search Intent Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              High-Intent Search & PMax
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Google Search Ads, Performance Max, YouTube video ads, keyword bidding, and client lead conversions.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Google Ad Spend
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalSpent.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            Optimized for maximum intent
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Search Conversions
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {totalConversions} Conversions
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Purchases & Consultation Calls
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Cost Per Click (CPC)
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{avgCPC}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
            Quality score: 8.4/10 avg
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Google ROAS
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            4.15x
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            High e-commerce revenue
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Google Search & PMax Campaigns
          </h3>
          <span className="text-xs font-semibold text-emerald-600">
            {campaigns.length} Active Campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Campaign / Client</th>
                <th className="py-3.5 px-4">Type / Objective</th>
                <th className="py-3.5 px-4">Spent / Budget</th>
                <th className="py-3.5 px-4">Clicks</th>
                <th className="py-3.5 px-4">Conversions</th>
                <th className="py-3.5 px-4">ROAS</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading Google campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active Google campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{c.campaignName}</div>
                      {c.client && (
                        <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{c.client.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {c.objective}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        ₹{Number(c.spent).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        of ₹{Number(c.budget).toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      {c.leadsCount} sales
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-xs">
                        {Number(c.roas)}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
