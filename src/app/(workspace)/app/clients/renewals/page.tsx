"use client";

import { useState, useEffect } from "react";
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
  Plus,
  Loader2,
  Edit2,
  Download,
  Search,
  X,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ClientContract {
  id: string;
  name: string;
  brandName?: string | null;
  activePackage?: string | null;
  monthlyRetainer: number;
  contractRenewalDate?: string | null;
  status: string;
}

export default function ContractsRenewalsPage() {
  const [clients, setClients] = useState<ClientContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientContract | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [monthlyRetainer, setMonthlyRetainer] = useState("");
  const [activePackage, setActivePackage] = useState("");
  const [contractRenewalDate, setContractRenewalDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClients(data.data);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenRenew(c: ClientContract) {
    setSelectedClient(c);
    setMonthlyRetainer(String(c.monthlyRetainer || 0));
    setActivePackage(c.activePackage || "Growth Retainer");
    setContractRenewalDate(
      c.contractRenewalDate
        ? new Date(c.contractRenewalDate).toISOString().slice(0, 10)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setStatus(c.status || "ACTIVE");
    setShowRenewModal(true);
  }

  function addMonthsToDate(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setContractRenewalDate(d.toISOString().slice(0, 10));
  }

  async function handleSaveRenewal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/agency/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyRetainer: Number(monthlyRetainer) || 0,
          activePackage,
          contractRenewalDate: contractRenewalDate ? new Date(contractRenewalDate).toISOString() : null,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowRenewModal(false);
        fetchClients();
      } else {
        alert(data.error || "Failed to renew agreement");
      }
    } catch (err: any) {
      alert(err.message || "Failed to renew agreement");
    } finally {
      setSubmitting(false);
    }
  }

  function exportContractsToCSV() {
    if (clients.length === 0) {
      alert("No contracts to export.");
      return;
    }

    const headers = ["Client Name", "Brand", "Package", "Monthly Retainer (INR)", "Annualized Value (ARR)", "Renewal Date", "Status"];
    const rows = clients.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.brandName || "").replace(/"/g, '""')}"`,
      `"${(c.activePackage || "Growth Retainer").replace(/"/g, '""')}"`,
      c.monthlyRetainer || 0,
      (c.monthlyRetainer || 0) * 12,
      c.contractRenewalDate ? new Date(c.contractRenewalDate).toLocaleDateString("en-IN") : "Rolling Monthly",
      c.status || "ACTIVE",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contracts_renewals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculate MRR and ARR totals
  const totalMRR = clients.reduce((sum, c) => sum + (Number(c.monthlyRetainer) || 0), 0);
  const totalARR = totalMRR * 12;

  const filteredClients = clients.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.brandName && c.brandName.toLowerCase().includes(search.toLowerCase())) ||
      (c.activePackage && c.activePackage.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contracts & Renewals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Retention & LTV Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track annual agreement expiry dates, renewal probabilities, client retention, and retainer upsell opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportContractsToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/app/clients"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
          >
            <Building2 className="w-4 h-4" />
            <span>All Clients (Client 360°)</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Monthly Recurring (MRR)</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            ₹{totalMRR.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">Annualized Run Rate (ARR)</div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            ₹{totalARR.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Active Retainers Tracked</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {clients.length} Accounts
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search contracts by client or plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading client contracts...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Client Contracts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? "No contracts match your search term."
              : "When you add clients and set their monthly retainer and contract renewal date in Client 360°, they will be tracked here."}
          </p>
          <div className="mt-4">
            <Link
              href="/app/clients"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Client Contract</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Contract Cards */
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((item) => {
            const renewalDate = item.contractRenewalDate ? new Date(item.contractRenewalDate) : null;
            const daysLeft = renewalDate
              ? Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
            const isOverdue = daysLeft !== null && daysLeft < 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      <span className="text-xs text-slate-400">({item.brandName || "Account"})</span>
                      {isExpiringSoon && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expiring in {daysLeft} days</span>
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expired {Math.abs(daysLeft!)} days ago</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.activePackage || "Custom Agency Retainer"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Retainer</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        ₹{Number(item.monthlyRetainer).toLocaleString("en-IN")}/mo
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Contract Renewal</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {renewalDate ? renewalDate.toLocaleDateString("en-IN") : "Rolling Monthly"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRenew(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 text-xs font-semibold transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Extend / Renew</span>
                      </button>

                      <Link
                        href="/app/clients"
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                        title="View Client Workspace"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renew / Extend Retainer Modal */}
      {showRenewModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Extend / Renew Retainer: {selectedClient.name}</span>
              </h2>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Retainer Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlyRetainer}
                  onChange={(e) => setMonthlyRetainer(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Package / Service Scope
                </label>
                <select
                  value={activePackage}
                  onChange={(e) => setActivePackage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Growth Retainer">Growth Retainer (Social + Ads + SEO)</option>
                  <option value="Scale Omnichannel">Scale Omnichannel (Performance + Creatives)</option>
                  <option value="Enterprise Creative Pod">Enterprise Creative Pod (Dedicated Lead)</option>
                  <option value="Paid Media Accelerator">Paid Media Accelerator (Meta + Google)</option>
                  <option value="Custom Agreement">Custom Bespoke Retainer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Contract Renewal Date
                </label>
                <input
                  type="date"
                  value={contractRenewalDate}
                  onChange={(e) => setContractRenewalDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
                  <button
                    type="button"
                    onClick={() => addMonthsToDate(3)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition"
                  >
                    +3 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => addMonthsToDate(6)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => addMonthsToDate(12)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-semibold transition"
                  >
                    +1 Year
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Good Standing)</option>
                  <option value="RENEWED">RENEWED (Extension Locked)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Negotiation)</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
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
                  <span>Save Extension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

