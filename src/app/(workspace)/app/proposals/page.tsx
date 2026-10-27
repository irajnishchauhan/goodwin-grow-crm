"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  FileCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  Trash2,
  Download,
  Search,
} from "lucide-react";

interface ProposalItem {
  id: string;
  quotationNumber: string;
  customerName?: string;
  total: number;
  totalAmount?: number;
  status: string;
  createdAt: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProposals(data.data);
      } else {
        setProposals([]);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        fetchProposals();
      } else {
        alert(data.error || "Failed to update proposal status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update proposal status");
    }
  }

  async function handleDelete(id: string, qNumber: string) {
    if (!confirm(`Are you sure you want to delete proposal ${qNumber}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchProposals();
      } else {
        alert(data.error || "Failed to delete proposal");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete proposal");
    }
  }

  function exportToCSV() {
    if (proposals.length === 0) {
      alert("No proposals to export.");
      return;
    }

    const headers = ["Proposal Number", "Customer Name", "Total Amount (INR)", "Status", "Created Date"];
    const rows = proposals.map((p) => [
      p.quotationNumber,
      `"${(p.customerName || "Prospective Client").replace(/"/g, '""')}"`,
      p.totalAmount ?? p.total ?? 0,
      p.status,
      new Date(p.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `proposals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName && p.customerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Proposals & Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Sales-to-Client Handoff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build high-converting agency proposals from service catalogs, track prospect approvals, and convert won deals into active client workspaces.
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
          <Link
            href="/app/quotations"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Proposal / Quotation</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals by # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? "All Proposals" : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Proposals Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No proposals match your current filter."
              : "Create high-converting proposals or client service quotes. Once accepted, they can be directly converted into client retainers."}
          </p>
          <div className="mt-4">
            <Link
              href="/app/quotations"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Proposal</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Proposals Grid */
        <div className="grid grid-cols-1 gap-4">
          {filteredProposals.map((item) => {
            const val = item.totalAmount ?? item.total ?? 0;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {item.quotationNumber}
                      </span>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer border focus:outline-none ${
                          item.status === "ACCEPTED" || item.status === "CONVERTED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : item.status === "SENT"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="EXPIRED">Expired</option>
                      </select>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {item.customerName || "Prospective Client"}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Total Value</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        ₹{Number(val).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(item.id, item.quotationNumber)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Proposal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

