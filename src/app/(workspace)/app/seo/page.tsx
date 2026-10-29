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
  Edit2,
  Trash2,
  Loader2,
  X,
  Save,
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
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [currentRank, setCurrentRank] = useState("1");
  const [searchVolume, setSearchVolume] = useState("2500");
  const [difficulty, setDifficulty] = useState("28");
  const [gbpScore, setGbpScore] = useState("92");
  const [clientId, setClientId] = useState("");

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<SeoTracker | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [editCurrentRank, setEditCurrentRank] = useState("1");
  const [editPreviousRank, setEditPreviousRank] = useState("3");
  const [editSearchVolume, setEditSearchVolume] = useState("2500");
  const [editGbpScore, setEditGbpScore] = useState("90");
  const [editBacklinks, setEditBacklinks] = useState("45");
  const [editClientId, setEditClientId] = useState("");

  useEffect(() => {
    fetchSeo();
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success) setClients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

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

  async function handleCreateTracker(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          targetUrl,
          currentRank,
          searchVolume,
          difficulty,
          gbpScore,
          clientId: clientId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setKeyword("");
        setTargetUrl("");
        fetchSeo();
      } else {
        alert(data.error || "Failed to create SEO tracker");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(t: SeoTracker) {
    setEditingTracker(t);
    setEditKeyword(t.keyword);
    setEditTargetUrl(t.targetUrl || "");
    setEditCurrentRank(String(t.currentRank));
    setEditPreviousRank(String(t.previousRank));
    setEditSearchVolume(String(t.searchVolume));
    setEditGbpScore(String(t.gbpScore));
    setEditBacklinks(String(t.backlinksCount));
    setEditClientId(t.client?.id || "");
    setEditModalOpen(true);
  }

  async function handleUpdateTracker(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTracker) return;
    setSaving(true);

    // Optimistic UI update
    setTrackers((prev) =>
      prev.map((t) =>
        t.id === editingTracker.id
          ? {
              ...t,
              keyword: editKeyword,
              targetUrl: editTargetUrl,
              currentRank: Number(editCurrentRank),
              previousRank: Number(editPreviousRank),
              searchVolume: Number(editSearchVolume),
              gbpScore: Number(editGbpScore),
              backlinksCount: Number(editBacklinks),
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/agency/seo/${editingTracker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: editKeyword,
          targetUrl: editTargetUrl,
          currentRank: editCurrentRank,
          previousRank: editPreviousRank,
          searchVolume: editSearchVolume,
          gbpScore: editGbpScore,
          backlinksCount: editBacklinks,
          clientId: editClientId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingTracker(null);
        fetchSeo();
      } else {
        alert(data.error || "Failed to update SEO tracker");
        fetchSeo();
      }
    } catch (err) {
      console.error(err);
      fetchSeo();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTracker(id: string, kw: string) {
    if (!confirm(`Are you sure you want to stop tracking keyword "${kw}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setTrackers((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/agency/seo/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete SEO tracker");
        fetchSeo();
      }
    } catch (err) {
      console.error(err);
      fetchSeo();
    } finally {
      setDeletingId(null);
    }
  }

  const top3Rankings = trackers.filter((t) => t.currentRank <= 3).length;
  const avgGbpScore =
    trackers.length > 0
      ? Math.round(trackers.reduce((acc, t) => acc + (t.gbpScore || 0), 0) / trackers.length)
      : 0;
  const totalVolume = trackers.reduce((acc, t) => acc + (t.searchVolume || 0), 0);
  const totalBacklinks = trackers.reduce((acc, t) => acc + (t.backlinksCount || 0), 0);
  const filteredTrackers = trackers.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.keyword.toLowerCase().includes(q) ||
      (t.client?.name && t.client.name.toLowerCase().includes(q)) ||
      (t.targetUrl && t.targetUrl.toLowerCase().includes(q))
    );
  });

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

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Keyword</span>
        </button>
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
            {totalVolume.toLocaleString()}
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
            {totalBacklinks} Citations
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            Local directories, PR & industry blogs
          </div>
        </div>
      </div>

      {/* Keyword Tracking Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Client Search Keywords & Local Rankings
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keyword or client..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {filteredTrackers.length} Tracked Queries
            </span>
          </div>
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
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading SEO rankings...
                  </td>
                </tr>
              ) : filteredTrackers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No tracked keywords found.
                  </td>
                </tr>
              ) : (
                filteredTrackers.map((t) => {
                  const rankDiff = t.previousRank - t.currentRank;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
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
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Edit Keyword Tracking"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTracker(t.id, t.keyword)}
                            disabled={deletingId === t.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                            title="Delete Keyword Tracker"
                          >
                            {deletingId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Track New Keyword</h3>
                <p className="text-xs text-slate-500">Add client search query to organic rank monitor.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTracker} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Search Keyword *</label>
                <input
                  type="text"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Best Ceramic Coating in Delhi NCR"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Landing Page URL</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://clientbrand.com/service"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Google Rank</label>
                  <input
                    type="number"
                    value={currentRank}
                    onChange={(e) => setCurrentRank(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Search Volume /mo</label>
                  <input
                    type="number"
                    value={searchVolume}
                    onChange={(e) => setSearchVolume(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Difficulty (0-100)</label>
                  <input
                    type="number"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GBP Map Score (%)</label>
                  <input
                    type="number"
                    value={gbpScore}
                    onChange={(e) => setGbpScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Start Tracking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Keyword Tracking</h3>
                <p className="text-xs text-slate-500">Update ranking position, search volume, or citations.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTracker} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Keyword *</label>
                <input
                  type="text"
                  required
                  value={editKeyword}
                  onChange={(e) => setEditKeyword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client</label>
                <select
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">No Client / General</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Google Rank</label>
                  <input
                    type="number"
                    value={editCurrentRank}
                    onChange={(e) => setEditCurrentRank(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Previous Rank</label>
                  <input
                    type="number"
                    value={editPreviousRank}
                    onChange={(e) => setEditPreviousRank(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Search Vol.</label>
                  <input
                    type="number"
                    value={editSearchVolume}
                    onChange={(e) => setEditSearchVolume(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GBP Score</label>
                  <input
                    type="number"
                    value={editGbpScore}
                    onChange={(e) => setEditGbpScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Backlinks</label>
                  <input
                    type="number"
                    value={editBacklinks}
                    onChange={(e) => setEditBacklinks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landing Page URL</label>
                <input
                  type="url"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
