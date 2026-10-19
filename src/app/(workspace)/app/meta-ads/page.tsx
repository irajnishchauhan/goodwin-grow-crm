"use client";

import { useState, useEffect } from "react";
import {
  Target,
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
  platform: string;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function MetaAdsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("WhatsApp Direct Messages");
  const [budget, setBudget] = useState("25000");
  const [spent, setSpent] = useState("12000");
  const [leadsCount, setLeadsCount] = useState("120");
  const [roas, setRoas] = useState("4.8");
  const [clientId, setClientId] = useState("");

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
      const res = await fetch("/api/agency/ads?platform=META");
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
    try {
      const res = await fetch("/api/agency/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          platform: "META",
          objective,
          budget,
          spent,
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
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Aggregate metrics
  const totalBudget = campaigns.reduce((acc, c) => acc + Number(c.budget), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + Number(c.spent), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leadsCount || 0), 0);
  const avgCPL = totalLeads > 0 ? (totalSpent / totalLeads).toFixed(2) : "0.00";
  const avgROAS =
    campaigns.length > 0
      ? (campaigns.reduce((acc, c) => acc + Number(c.roas), 0) / campaigns.length).toFixed(1)
      : "5.1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Meta Ads Performance Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Instagram & Facebook Ads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Meta ad spend, instant lead forms, WhatsApp conversions, CPL (Cost per Lead), and ROAS tracking.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Meta Campaign</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Meta Ad Spend
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalSpent.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            of ₹{totalBudget.toLocaleString("en-IN")} allocated budget
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Qualified Leads Captured
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {totalLeads} Leads
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Synced directly to CRM Leads
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Cost Per Lead (CPL)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{avgCPL}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            -22% lower than industry avg
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Meta ROAS
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {avgROAS}x
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            Direct revenue multiplier
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Client Campaigns on Meta Ad Network
          </h3>
          <span className="text-xs font-semibold text-blue-600">
            {campaigns.length} Active Campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Campaign / Client</th>
                <th className="py-3.5 px-4">Objective</th>
                <th className="py-3.5 px-4">Spent / Budget</th>
                <th className="py-3.5 px-4">Leads</th>
                <th className="py-3.5 px-4">Cost Per Lead (CPL)</th>
                <th className="py-3.5 px-4">ROAS</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading Meta campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active Meta campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{c.campaignName}</div>
                      {c.client && (
                        <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
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
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {c.leadsCount}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{Number(c.cpl).toFixed(2)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Meta Ad Campaign</h3>
                <p className="text-xs text-slate-500">Record a new Instagram or Facebook ad set.</p>
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
                  placeholder="e.g. Sapna Detailing — WhatsApp Conversions"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Objective</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="WhatsApp Direct Messages">WhatsApp Direct Messages</option>
                    <option value="Instant Lead Forms">Instant Lead Forms</option>
                    <option value="Website Conversions">Website Conversions</option>
                    <option value="Video Views & Brand Awareness">Video Views & Brand Awareness</option>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leads Count</label>
                  <input
                    type="number"
                    value={leadsCount}
                    onChange={(e) => setLeadsCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target ROAS</label>
                  <input
                    type="number"
                    step="0.1"
                    value={roas}
                    onChange={(e) => setRoas(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
