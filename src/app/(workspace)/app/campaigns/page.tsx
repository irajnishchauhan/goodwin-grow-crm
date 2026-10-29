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
  Edit2,
  Trash2,
  Download,
  X,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
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

interface ClientOption {
  id: string;
  name: string;
  brandName?: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    campaignName: "",
    platform: "META",
    objective: "Lead Generation",
    clientId: "",
    budget: "",
    spent: "",
    leadsCount: "",
    roas: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
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

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClients(data.data);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  }

  function handleOpenCreate() {
    setFormData({
      campaignName: "",
      platform: "META",
      objective: "Lead Generation",
      clientId: clients[0]?.id || "",
      budget: "50000",
      spent: "0",
      leadsCount: "0",
      roas: "3.5",
      status: "ACTIVE",
    });
    setShowCreateModal(true);
  }

  function handleOpenEdit(c: AdCampaign) {
    setSelectedCampaign(c);
    setFormData({
      campaignName: c.campaignName,
      platform: c.platform || "META",
      objective: c.objective || "Lead Generation",
      clientId: c.client?.id || "",
      budget: String(c.budget || 0),
      spent: String(c.spent || 0),
      leadsCount: String(c.leadsCount || 0),
      roas: String(c.roas || 0),
      status: c.status || "ACTIVE",
    });
    setShowEditModal(true);
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.campaignName.trim()) {
      alert("Please enter a campaign name");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/agency/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: formData.campaignName,
          platform: formData.platform,
          objective: formData.objective,
          clientId: formData.clientId || null,
          budget: Number(formData.budget) || 0,
          spent: Number(formData.spent) || 0,
          leadsCount: Number(formData.leadsCount) || 0,
          roas: Number(formData.roas) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to create campaign");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/agency/ads/${selectedCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: formData.campaignName,
          platform: formData.platform,
          objective: formData.objective,
          clientId: formData.clientId || null,
          budget: Number(formData.budget) || 0,
          spent: Number(formData.spent) || 0,
          leadsCount: Number(formData.leadsCount) || 0,
          roas: Number(formData.roas) || 0,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to update campaign");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(c: AdCampaign) {
    const nextStatus = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/agency/ads/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Failed to toggle campaign status:", err);
    }
  }

  async function handleDeleteCampaign(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete campaign "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/agency/ads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to delete campaign");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign");
    }
  }

  function exportToCSV() {
    if (campaigns.length === 0) {
      alert("No campaigns to export.");
      return;
    }

    const headers = ["Campaign Name", "Client", "Platform", "Objective", "Budget", "Spent", "Leads", "ROAS", "Status"];
    const rows = campaigns.map((c) => [
      `"${c.campaignName.replace(/"/g, '""')}"`,
      `"${(c.client?.name || c.client?.brandName || "General").replace(/"/g, '""')}"`,
      c.platform || "Paid Media",
      c.objective || "Lead Gen",
      c.budget,
      c.spent,
      c.leadsCount,
      c.roas,
      c.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered campaigns
  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      (c.client?.name && c.client.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.client?.brandName && c.client.brandName.toLowerCase().includes(search.toLowerCase()));

    const matchesPlatform = platformFilter === "ALL" || (c.platform && c.platform.toUpperCase() === platformFilter);

    return matchesSearch && matchesPlatform;
  });

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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Campaign</span>
          </button>
          <Link
            href="/app/meta-ads"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Megaphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Meta Ads Hub</span>
          </Link>
          <Link
            href="/app/google-ads"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Ads Hub</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "META", "GOOGLE", "LINKEDIN"].map((platform) => (
            <button
              key={platform}
              onClick={() => setPlatformFilter(platform)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                platformFilter === platform
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {platform === "ALL" ? "All Platforms" : platform}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading active campaigns...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Campaigns Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || platformFilter !== "ALL"
              ? "No campaigns matched your search or platform filter."
              : "You currently have no ad campaigns running. Launch your first campaign to start tracking leads and ROAS."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              + Create Campaign
            </button>
          </div>
        </div>
      ) : (
        /* Campaign Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{c.client?.name || c.client?.brandName || "General Agency Campaign"}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c)}
                      title="Click to toggle ACTIVE / PAUSED"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : c.status === "PAUSED"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {c.status}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Edit Campaign"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c.id, c.campaignName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                    Budget: ₹{Number(c.budget).toLocaleString("en-IN")}
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

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" />
                <span>Create New Campaign</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 High-Intent Lead Gen"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="META">Meta Ads (FB/IG)</option>
                    <option value="GOOGLE">Google Search / Performance Max</option>
                    <option value="LINKEDIN">LinkedIn Ads</option>
                    <option value="TWITTER">X / Twitter</option>
                    <option value="YOUTUBE">YouTube Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Objective
                  </label>
                  <select
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="Conversions">E-commerce Conversions</option>
                    <option value="Traffic">Website Traffic</option>
                    <option value="Brand Awareness">Brand Awareness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Workspace
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- General Agency Campaign (No Client) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.brandName ? `(${c.brandName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target ROAS (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.roas}
                    onChange={(e) => setFormData({ ...formData, roas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Spent (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leads / Conversions Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadsCount}
                    onChange={(e) => setFormData({ ...formData, leadsCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>Edit Campaign: {selectedCampaign.campaignName}</span>
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Running)</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="META">Meta Ads (FB/IG)</option>
                    <option value="GOOGLE">Google Search / PMax</option>
                    <option value="LINKEDIN">LinkedIn Ads</option>
                    <option value="TWITTER">X / Twitter</option>
                    <option value="YOUTUBE">YouTube Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Workspace
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- General Agency Campaign (No Client) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.brandName ? `(${c.brandName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target ROAS (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.roas}
                    onChange={(e) => setFormData({ ...formData, roas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Spent (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Leads / Conversions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadsCount}
                    onChange={(e) => setFormData({ ...formData, leadsCount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

