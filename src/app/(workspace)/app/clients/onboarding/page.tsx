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
  Search,
  CheckSquare,
  Square,
  AlertCircle,
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

const ONBOARDING_STEPS = [
  { id: 1, title: "Agreement & Retainer Signed", desc: "Digital contract signed and advance billing confirmed." },
  { id: 2, title: "Brand Kit & High-Res Assets Intake", desc: "Logos, fonts, typography, color palette, and raw media library." },
  { id: 3, title: "Meta & Google Ad Accounts Delegated", desc: "Business Manager partner delegation & pixel tracking verified." },
  { id: 4, title: "90-Day Campaign Roadmap Approved", desc: "Sprint timeline, deliverables schedule, and KPIs locked." },
  { id: 5, title: "Executive Kickoff Meeting Held", desc: "Creative pod introduced to client leadership team." },
];

export default function ClientOnboardingPage() {
  const [clients, setClients] = useState<OnboardingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);

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

  // Calculate which step indices are completed based on progress percentage
  function getCompletedStepsCount(progress: number): number {
    return Math.min(5, Math.max(0, Math.round((progress / 100) * 5)));
  }

  async function handleToggleStep(client: OnboardingClient, stepIndex: number) {
    const currentCompleted = getCompletedStepsCount(client.onboardingProgress || 0);
    // If clicking on an already completed step that is the last completed, toggle it off; otherwise set up to stepIndex
    let newCompletedCount = stepIndex;
    if (currentCompleted === stepIndex) {
      newCompletedCount = stepIndex - 1;
    }

    const newProgress = Math.round((newCompletedCount / 5) * 100);

    // Optimistically update local state
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, onboardingProgress: newProgress } : c))
    );

    try {
      setSavingId(client.id);
      const res = await fetch(`/api/agency/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingProgress: newProgress }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to update onboarding progress");
        fetchClients();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update onboarding progress");
      fetchClients();
    } finally {
      setSavingId(null);
    }
  }

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.brandName && c.brandName.toLowerCase().includes(search.toLowerCase())) ||
      (c.accountManagerName && c.accountManagerName.toLowerCase().includes(search.toLowerCase()));

    const isComplete = (c.onboardingProgress || 0) >= 100;
    const matchesFilter =
      filter === "ALL" ||
      (filter === "COMPLETED" && isComplete) ||
      (filter === "IN_PROGRESS" && !isComplete);

    return matchesSearch && matchesFilter;
  });

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
              Interactive SOP Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-friction 5-step client onboarding engine. Click any milestone checkbox to update and sync progress in real time.
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search onboarding clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({clients.length})
          </button>
          <button
            onClick={() => setFilter("IN_PROGRESS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "IN_PROGRESS"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            In Progress ({clients.filter((c) => (c.onboardingProgress || 0) < 100).length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === "COMPLETED"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Completed ({clients.filter((c) => (c.onboardingProgress || 0) >= 100).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading onboarding progress...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Clients Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || filter !== "ALL"
              ? "No onboarding clients match your active filter."
              : "When you add a new client in Client 360°, their 5-step onboarding milestone checklist will appear here automatically."}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClients.map((c) => {
            const completedCount = getCompletedStepsCount(c.onboardingProgress || 0);
            const isFinished = (c.onboardingProgress || 0) >= 100;

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{c.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {savingId === c.id && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isFinished
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {c.onboardingProgress || 0}% Complete ({completedCount}/5 SOPs)
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {c.brandName || c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.activePackage || "Active Retainer"}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isFinished ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"
                      }`}
                      style={{ width: `${c.onboardingProgress || 0}%` }}
                    />
                  </div>

                  {/* SOP Milestones List */}
                  <div className="mt-5 space-y-2.5">
                    {ONBOARDING_STEPS.map((step) => {
                      const isStepDone = step.id <= completedCount;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleToggleStep(c, step.id)}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                            isStepDone
                              ? "bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50"
                              : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isStepDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold leading-tight ${
                                isStepDone ? "text-emerald-950 line-through/40" : "text-slate-800"
                              }`}
                            >
                              Step {step.id}: {step.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {step.desc}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 shrink-0">
                            20%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Lead Pod Manager: <strong className="text-slate-700">{c.accountManagerName || "Unassigned"}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/app/clients`}
                      className="font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Logins Vault</span>
                    </Link>
                    <Link
                      href={`/app/clients`}
                      className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>Client 360°</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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

