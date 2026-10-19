"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Building2,
  Filter,
  Eye,
  MessageSquare,
  Upload,
  User,
  X,
  Layers,
  ThumbsUp,
} from "lucide-react";

interface CreativeAsset {
  id: string;
  title: string;
  assetType: string;
  dimensions?: string | null;
  fileUrl?: string | null;
  version: number;
  reviewStatus: string;
  clientFeedback?: string | null;
  submittedBy?: string | null;
  reviewedAt?: string | null;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function CreativeApprovalsPage() {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewModalAsset, setReviewModalAsset] = useState<CreativeAsset | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");

  useEffect(() => {
    fetchAssets();
    fetchClients();
  }, [selectedClientId, statusFilter]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success) setClients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchAssets() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClientId !== "ALL") params.set("clientId", selectedClientId);
      if (statusFilter !== "ALL") params.set("reviewStatus", statusFilter);

      const res = await fetch(`/api/agency/creatives?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string, feedback?: string) {
    try {
      const res = await fetch(`/api/agency/creatives/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: newStatus,
          clientFeedback: feedback !== undefined ? feedback : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReviewModalAsset(null);
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Creative Review & Approval Workflow
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Asset Review Pod
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Two-tier review workflow: Internal Creative Director Approval &rarr; Client Green Light &rarr; Ready for Publishing.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
          >
            <option value="ALL">All Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {["ALL", "PENDING", "APPROVED", "CHANGES_REQUESTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Creative Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading creative assets...</div>
        ) : assets.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No creative assets in this review stage.</div>
        ) : (
          assets.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square bg-slate-100 overflow-hidden group">
                  <img
                    src={item.fileUrl || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                    {item.dimensions || "1080x1080"} • v{item.version}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        item.reviewStatus === "APPROVED"
                          ? "bg-emerald-500 text-white"
                          : item.reviewStatus === "CHANGES_REQUESTED"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      {item.reviewStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  {item.client && (
                    <div className="text-[11px] font-bold text-emerald-700 mb-1">
                      {item.client.name}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Format: {item.assetType}</span>
                    <span>By: {item.submittedBy || "Design Team"}</span>
                  </div>

                  {item.clientFeedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                      <span className="font-semibold block mb-0.5">Feedback Note:</span>
                      "{item.clientFeedback}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    item.reviewStatus === "APPROVED"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{item.reviewStatus === "APPROVED" ? "Approved" : "Approve"}</span>
                </button>

                <button
                  onClick={() => {
                    setReviewModalAsset(item);
                    setFeedbackInput(item.clientFeedback || "");
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Request Revisions</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Revision Modal */}
      {reviewModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Creative Revisions</h3>
                <p className="text-xs text-slate-500">{reviewModalAsset.title}</p>
              </div>
              <button onClick={() => setReviewModalAsset(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Notes & Change Requests
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Specify font changes, color grading, brand logo positioning, or copy adjustments..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setReviewModalAsset(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(reviewModalAsset.id, "CHANGES_REQUESTED", feedbackInput)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                >
                  Submit Revision Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
