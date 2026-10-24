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
} from "lucide-react";

interface ProposalItem {
  id: string;
  quotationNumber: string;
  customerName?: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

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

        <Link
          href="/app/quotations"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Proposal / Quotation</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading proposals...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Proposals Generated Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create high-converting proposals or client service quotes. Once accepted, they can be directly converted into client retainers.
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
          {proposals.map((item) => (
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
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "ACCEPTED" || item.status === "CONVERTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "SENT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
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
                      ₹{Number(item.total).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
