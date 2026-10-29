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
  Edit2,
  Trash2,
  Loader2,
  Save,
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
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("High-Intent Search Ads");
  const [budget, setBudget] = useState("30000");
  const [spent, setSpent] = useState("14500");
  const [clicks, setClicks] = useState("1600");
  const [leadsCount, setLeadsCount] = useState("85");
  const [roas, setRoas] = useState("4.2");
  const [clientId, setClientId] = useState("");

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editSpent, setEditSpent] = useState("");
  const [editClicks, setEditClicks] = useState("");
  const [editImpressions, setEditImpressions] = useState("");
  const [editLeads, setEditLeads] = useState("");
  const [editCpl, setEditCpl] = useState("");
  const [editRoas, setEditRoas] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editClientId, setEditClientId] = useState("");

  useEffect(() => {
    fetchCampaigns();
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

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          platform: "GOOGLE",
          objective,
          budget,
          spent,
          clicks,
          leadsCount,
          roas,
          clientId: clientId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setCampaignName("");
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to create campaign");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(c: AdCampaign) {
    setEditingCampaign(c);
    setEditName(c.campaignName);
    setEditObjective(c.objective);
    setEditBudget(String(c.budget));
    setEditSpent(String(c.spent));
    setEditClicks(String(c.clicks || 0));
    setEditImpressions(String(c.impressions || 0));
    setEditLeads(String(c.leadsCount));
    setEditCpl(String(c.cpl || 0));
    setEditRoas(String(c.roas));
    setEditStatus(c.status);
    setEditClientId(c.client?.id || "");
    setEditModalOpen(true);
  }

  async function handleUpdateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCampaign) return;
    setSaving(true);

    const calcCpl = editCpl !== "" ? Number(editCpl) : (Number(editLeads) > 0 ? Number(editSpent) / Number(editLeads) : 0);

    // Optimistic UI update
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === editingCampaign.id
          ? {
              ...c,
              campaignName: editName,
              objective: editObjective,
              budget: Number(editBudget),
              spent: Number(editSpent),
              clicks: Number(editClicks),
              impressions: Number(editImpressions || 0),
              leadsCount: Number(editLeads),
              cpl: calcCpl,
              roas: Number(editRoas),
              status: editStatus,
            }
          : c
      )
    );

    try {
      const res = await fetch(`/api/agency/ads/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: editName,
          objective: editObjective,
          budget: Number(editBudget),
          spent: Number(editSpent),
          clicks: Number(editClicks),
          impressions: Number(editImpressions || 0),
          leadsCount: Number(editLeads),
          cpl: calcCpl,
          roas: Number(editRoas),
          status: editStatus,
          clientId: editClientId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        alert(data.error || "Failed to update campaign");
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
      fetchCampaigns();
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(campaignId: string, newStatus: string) {
    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
    );

    try {
      await fetch(`/api/agency/ads/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchCampaigns();
    }
  }

  async function handleDeleteCampaign(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setCampaigns((prev) => prev.filter((c) => c.id !== id));

    try {
      const res = await fetch(`/api/agency/ads/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete campaign");
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
      fetchCampaigns();
    } finally {
      setDeletingId(null);
    }
  }

  const totalSpent = campaigns.reduce((acc, c) => acc + Number(c.spent), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.leadsCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const avgCPC = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0.00";
  const avgROAS =
    campaigns.length > 0
      ? (campaigns.reduce((acc, c) => acc + Number(c.roas), 0) / campaigns.length).toFixed(2)
      : "0.0";

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

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Google Campaign</span>
        </button>
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
            {avgROAS}x
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
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading Google campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No active Google campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
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
                      <select
                        value={c.status}
                        onChange={(e) => handleQuickStatusChange(c.id, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : c.status === "PAUSED"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c.id, c.campaignName)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          title="Delete Campaign"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Google Ad Campaign</h3>
                <p className="text-xs text-slate-500">Record a high-intent Google Search or Performance Max campaign.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Lithium Inverter Batteries — Google Search High Intent"
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
                  <option value="">Select an enrolled client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Type</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="High-Intent Search Ads">High-Intent Search Ads</option>
                    <option value="Performance Max (PMax)">Performance Max (PMax)</option>
                    <option value="YouTube Video Action">YouTube Video Action</option>
                    <option value="Google Local Maps Pack Ads">Google Local Maps Pack Ads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Spent (₹)</label>
                  <input
                    type="number"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clicks</label>
                  <input
                    type="number"
                    value={clicks}
                    onChange={(e) => setClicks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    value={leadsCount}
                    onChange={(e) => setLeadsCount(e.target.value)}
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
                  <span>Launch Google Ad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Google Ad Campaign</h3>
                <p className="text-xs text-slate-500">Update budget, clicks, conversions, or target status.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Type</label>
                  <select
                    value={editObjective}
                    onChange={(e) => setEditObjective(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="High-Intent Search Ads">High-Intent Search Ads</option>
                    <option value="Performance Max (PMax)">Performance Max (PMax)</option>
                    <option value="YouTube Video Action">YouTube Video Action</option>
                    <option value="Google Local Maps Pack Ads">Google Local Maps Pack Ads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Spent (₹)</label>
                  <input
                    type="number"
                    value={editSpent}
                    onChange={(e) => setEditSpent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clicks</label>
                  <input
                    type="number"
                    value={editClicks}
                    onChange={(e) => setEditClicks(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    value={editLeads}
                    onChange={(e) => setEditLeads(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target ROAS</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editRoas}
                    onChange={(e) => setEditRoas(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPL (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCpl}
                    onChange={(e) => setEditCpl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Impressions</label>
                  <input
                    type="number"
                    value={editImpressions}
                    onChange={(e) => setEditImpressions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
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
