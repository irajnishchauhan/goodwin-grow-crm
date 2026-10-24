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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contracts & Renewals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Retention & LTV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track annual agreement expiry dates, renewal probabilities, client retention, and retainer upsell opportunities.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
        >
          <Building2 className="w-4 h-4" />
          <span>All Clients (Client 360°)</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading client contracts...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Client Contracts Active</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you add clients and set their monthly retainer and contract renewal date in Client 360°, they will be tracked here.
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
          {clients.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <span className="text-xs text-slate-400">({item.brandName || "Account"})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {item.activePackage || "Custom Agency Retainer"}
                  </div>
                </div>

                <div className="flex items-center gap-6">
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
                      <span>{item.contractRenewalDate ? new Date(item.contractRenewalDate).toLocaleDateString("en-IN") : "Rolling Monthly"}</span>
                    </div>
                  </div>

                  <Link
                    href="/app/clients"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
