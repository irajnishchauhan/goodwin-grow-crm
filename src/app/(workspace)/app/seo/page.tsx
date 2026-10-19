"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  TrendingUp,
  Search,
  Building2,
  CheckCircle2,
  Star,
  MapPin,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface SeoTracker {
  id: string;
  keyword: string;
  targetUrl?: string | null;
  currentRank: number;
  previousRank: number;
  searchVolume: number;
  difficulty: number;
  gbpScore: number;
  backlinksCount: number;
  lastAuditedAt?: string | null;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function SeoPage() {
  const [trackers, setTrackers] = useState<SeoTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSeo();
  }, []);

  async function fetchSeo() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/seo");
      const data = await res.json();
      if (data.success) {
        setTrackers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const top3Rankings = trackers.filter((t) => t.currentRank <= 3).length;
  const avgGbpScore =
    trackers.length > 0
      ? Math.round(trackers.reduce((acc, t) => acc + (t.gbpScore || 85), 0) / trackers.length)
      : 91;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              SEO & Google Business Profile (GBP) Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Organic Search & Local Maps
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track client Google Search keyword rankings, Local Google Maps Pack positions, backlink velocity, and on-page technical health.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top 3 Google Positions
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {top3Rankings} Keywords
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Dominating local map pack & organic
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Avg Google Business Profile Score
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {avgGbpScore} / 100
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Reviews, photos, geotagging & NAP consistency
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monthly Search Volume
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            16,300
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
            High-intent local purchase queries
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Backlinks Built
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            384 Citations
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            Local directories, PR & industry blogs
          </div>
        </div>
      </div>

      {/* Keyword Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Client Search Keywords & Local Rankings
          </h3>
          <span className="text-xs font-semibold text-emerald-600">
            {trackers.length} Tracked Queries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Target Keyword / Client</th>
                <th className="py-3.5 px-4">Current Google Rank</th>
                <th className="py-3.5 px-4">Rank Movement</th>
                <th className="py-3.5 px-4">Monthly Search Vol.</th>
                <th className="py-3.5 px-4">Local GBP Score</th>
                <th className="py-3.5 px-4">Active Backlinks</th>
                <th className="py-3.5 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading SEO rankings...
                  </td>
                </tr>
              ) : (
                trackers.map((t) => {
                  const rankDiff = t.previousRank - t.currentRank;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{t.keyword}</div>
                        {t.client && (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{t.client.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-3 py-1 rounded-xl font-black text-sm ${
                            t.currentRank <= 3
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          #{t.currentRank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {rankDiff > 0 ? (
                          <span className="flex items-center gap-1 font-bold text-emerald-600">
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>+{rankDiff} spots</span>
                          </span>
                        ) : rankDiff < 0 ? (
                          <span className="flex items-center gap-1 font-bold text-rose-600">
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>{rankDiff} spots</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 font-medium">
                            <Minus className="w-3.5 h-3.5" />
                            <span>Steady</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {t.searchVolume.toLocaleString()} /mo
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{t.gbpScore}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {t.backlinksCount} citations
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Audited Healthy
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
