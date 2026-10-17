"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Search, Globe, Phone, Mail, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      setLoading(true);
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, website, phone }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName("");
        setIndustry("");
        setWebsite("");
        setPhone("");
        fetchCompanies();
      } else {
        alert(data.error || "Failed to create company");
      }
    } catch {
      alert("Error creating company");
    } finally {
      setCreating(false);
    }
  }

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Companies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client organizations, corporate accounts, associated contacts, and pipeline opportunities.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client Company</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search companies by name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4">Website</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Associated Contacts</th>
                <th className="py-3.5 px-4">Deals</th>
                <th className="py-3.5 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading companies...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No client companies found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-100">
                        {c.name.charAt(0)}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.industry || "—"}</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-medium">
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{c.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.phone || "—"}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c._count?.contacts || 0} contacts</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{c._count?.deals || 0} deals</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Customer Company</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Automobile Manufacturing"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {creating ? "Saving..." : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
