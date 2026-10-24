"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Key,
  FolderOpen,
  Calendar,
  Building2,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";

interface OnboardingClient {
  id: string;
  name: string;
  brandName?: string | null;
  activePackage?: string | null;
  createdAt: string;
  onboardingProgress: number;
  accountManagerName?: string | null;
}

export default function ClientOnboardingPage() {
  const [clients, setClients] = useState<OnboardingClient[]>([]);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Client Onboarding Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Standard Operating Procedures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-friction 5-step client onboarding engine: contract signing, brand asset intake, ad account access, roadmap sign-off, and kickoff call.
          </p>
        </div>

        <Link
          href="/app/clients"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Client</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading onboarding progress...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Clients Currently in Onboarding</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you add a new client in Client 360°, their 5-step onboarding milestone checklist will appear here automatically.
          </p>
          <div className="mt-4">
            <Link
              href="/app/clients"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Go to Client 360°</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Onboarding Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {c.onboardingProgress || 0}% Complete
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {c.brandName || c.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {c.activePackage || "Active Retainer"}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${c.onboardingProgress || 0}%` }}
                />
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Manager: <strong className="text-slate-700">{c.accountManagerName || "Unassigned"}</strong>
                </span>
                <Link
                  href="/app/clients"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>View Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
