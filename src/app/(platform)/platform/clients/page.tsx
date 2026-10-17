"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  Shield,
  X,
  Key,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PlatformClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seatLimit, setSeatLimit] = useState(10);
  const [planCode, setPlanCode] = useState("growth");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("GoodwinAdmin@2026!");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const res = await fetch("/api/platform/clients");
      const data = await res.json();
      if (data.success) {
        setClients(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(val: string) {
    setName(val);
    // Auto-generate slug code
    if (!code || code === name.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      setCode(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/platform/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          industry,
          businessEmail,
          phone,
          seatLimit,
          planCode,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to provision client company");
      }

      setSuccessInfo(data.data);
      setModalOpen(false);
      resetForm();
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setCode("");
    setIndustry("");
    setBusinessEmail("");
    setPhone("");
    setSeatLimit(10);
    setPlanCode("growth");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("GoodwinAdmin@2026!");
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Companies</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-tenant client accounts, seat limits, and workspace provisioning.
          </p>
        </div>

        <button
          onClick={() => {
            setSuccessInfo(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client Company</span>
        </button>
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-300 text-sm">
                Client Workspace Provisioned: {successInfo.tenantName}
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                Workspace code: <span className="font-mono font-bold text-white">{successInfo.tenantCode}</span>.
                Administrator: <span className="font-bold text-white">{successInfo.adminEmail}</span>.
              </p>
              <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 inline-block">
                Invitation Token: {successInfo.invitationToken}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSuccessInfo(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Search */}
        <div className="max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Deals</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading client companies...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No client companies found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        {c.name.charAt(0)}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{c.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {c.subscription?.planName || "Starter"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{c.stats?.membersCount || 1} / {c.settings?.seatLimit || 10}</td>
                    <td className="py-3 px-4">{c.stats?.leadsCount || 0}</td>
                    <td className="py-3 px-4">{c.stats?.dealsCount || 0}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Provision New Client Company</h2>
                <p className="text-xs text-slate-400">
                  Initializes isolated database tenant, default sales pipeline, and company administrator.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Goodwin Batteries"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Workspace Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. goodwin-batteries"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Manufacturing, Retail"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="info@company.com"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="starter">Starter (5 Seats)</option>
                    <option value="growth">Growth (15 Seats)</option>
                    <option value="professional">Professional (50 Seats)</option>
                    <option value="enterprise">Enterprise (500 Seats)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Seat Limit
                  </label>
                  <input
                    type="number"
                    value={seatLimit}
                    onChange={(e) => setSeatLimit(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Primary Organization Administrator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Rajesh Chauhan"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Provisioning..." : "Provision Client Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
