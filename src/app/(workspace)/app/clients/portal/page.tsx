"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  MessageSquare,
  Sparkles,
  Layers,
  ThumbsUp,
  RotateCcw,
  Building2,
  Clock,
  Send,
  Loader2,
  ShieldCheck,
  Video,
  FileText,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ClientPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"APPROVALS" | "FEEDBACK" | "DELIVERABLES" | "REPORTS">("APPROVALS");

  // Approval Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackCreative, setFeedbackCreative] = useState<any | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Video preview modal
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string; title: string } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchPortalData(selectedClientId);
    }
  }, [selectedClientId]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const result = await res.json();
      if (result.success && result.data?.length > 0) {
        setClients(result.data);
        setSelectedClientId(result.data[0].id);
      } else {
        // Fallback fetch portal directly (e.g. if logged in as client user)
        fetchPortalData();
      }
    } catch {
      fetchPortalData();
    }
  }

  async function fetchPortalData(clientId?: string) {
    try {
      setLoading(true);
      const url = clientId ? `/api/portal?clientId=${clientId}` : "/api/portal";
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to load portal data", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveCreative(creativeId: string) {
    if (!confirm("Are you sure you want to approve this deliverable for publishing? Your name and timestamp will be recorded.")) {
      return;
    }

    setProcessingId(creativeId);
    try {
      const res = await fetch(`/api/agency/creatives/${creativeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: "APPROVED",
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("Deliverable successfully approved! Approver details recorded.");
        fetchPortalData(selectedClientId);
      } else {
        alert(result.error || "Failed to approve deliverable");
      }
    } catch {
      alert("Error approving deliverable");
    } finally {
      setProcessingId(null);
    }
  }

  function openFeedbackModal(creative: any) {
    setFeedbackCreative(creative);
    setFeedbackComment("");
    setFeedbackModalOpen(true);
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackCreative || !feedbackComment.trim()) return;

    setSubmittingComment(true);
    try {
      // 1. Post comment as client feedback (isInternal = false strictly)
      await fetch(`/api/agency/creatives/${feedbackCreative.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: feedbackComment.trim(),
          comment: feedbackComment.trim(),
          isInternal: false,
        }),
      });

      // 2. Set status to CHANGES_REQUESTED
      const res = await fetch(`/api/agency/creatives/${feedbackCreative.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: "CHANGES_REQUESTED",
        }),
      });

      const result = await res.json();
      if (result.success) {
        setFeedbackModalOpen(false);
        setFeedbackCreative(null);
        fetchPortalData(selectedClientId);
      } else {
        alert(result.error || "Failed to request changes");
      }
    } catch {
      alert("Error submitting change request");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Client Portal Workspace...</p>
      </div>
    );
  }

  const client = data?.client;
  const stats = data?.stats;
  const pendingApprovals = data?.pendingApprovals || [];
  const approvedCreatives = data?.approvedCreatives || [];
  const allCreatives = data?.creatives || [];
  const contentPosts = data?.contentPosts || [];
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-6">
      {/* Top Branded Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dedicated Client Portal • Goodwin Grow AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {client ? client.name : "Client Approval Workspace"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Review upcoming campaign deliverables, preview creative assets, submit version feedback, and give 1-click publishing authorizations.
            </p>
          </div>

          {/* Client Switcher for Agency Admin simulation */}
          {clients.length > 1 && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 self-start md:self-auto min-w-[240px]">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Viewing Client Workspace:
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold border border-white/20 focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Deliverables Progress Bar Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
            {client?.name ? client.name.charAt(0) : "C"}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {client?.name} — Monthly Deliverables Progress
            </h3>
            <p className="text-xs text-slate-500">
              {stats?.postsCompleted || 0} of {stats?.postsPlanned || 12} content deliverables approved & published
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${stats?.deliverablesProgress || 0}%` }}
            />
          </div>
          <span className="text-sm font-black text-emerald-700 min-w-[70px]">
            {stats?.deliverablesProgress || 0}% Done
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "APPROVALS"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("FEEDBACK")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "FEEDBACK"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback & Versions ({allCreatives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("DELIVERABLES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "DELIVERABLES"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Deliverables & Schedule ({contentPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "REPORTS"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Reports & Invoices</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Creatives Awaiting Your Client Review</span>
            </h2>
            <span className="text-xs text-slate-500">
              {pendingApprovals.length} item{pendingApprovals.length !== 1 ? "s" : ""} pending authorization
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No creatives are currently waiting for your review. Your agency team will alert you when new assets are submitted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingApprovals.map((item: any) => {
                const isVideo = item.mediaType === "video" || item.fileUrl?.endsWith(".mp4");

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Media Preview Box */}
                      <div className="relative aspect-square bg-slate-950 overflow-hidden group">
                        {isVideo ? (
                          <div
                            onClick={() => setPreviewMedia({ url: item.fileUrl, type: "video", title: item.title })}
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-900"
                          >
                            <Video className="w-12 h-12 text-emerald-400 group-hover:scale-110 transition duration-300" />
                            <span className="text-xs text-slate-300 mt-2 font-semibold">Click to Play Video Preview</span>
                          </div>
                        ) : (
                          <img
                            src={item.fileUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                            onClick={() => setPreviewMedia({ url: item.fileUrl, type: "image", title: item.title })}
                          />
                        )}

                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                          Version {item.version || item.versionNumber || 1}
                        </div>

                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h3>

                        {item.caption && (
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 italic leading-relaxed">
                            "{item.caption}"
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Status:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Awaiting Client Approval
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                      <button
                        onClick={() => openFeedbackModal(item)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleApproveCreative(item.id)}
                        disabled={processingId === item.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {processingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Deliverable</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEEDBACK & VERSION HISTORY */}
      {activeTab === "FEEDBACK" && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs text-emerald-900 leading-relaxed">
              <strong>Strict Privacy Guaranteed:</strong> Only client-visible feedback and revisions are presented here. Internal agency notes and designer margin thoughts are strictly segregated and omitted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allCreatives.map((c: any) => (
              <div key={c.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500">Current Version: v{c.version || c.versionNumber || 1}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                    {c.reviewStatus}
                  </span>
                </div>

                {/* Audit Approval Info if approved */}
                {c.approvedAt && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>
                      Approved by <strong>{c.approverName || "Client"}</strong> on {formatDate(c.approvedAt)}
                    </span>
                  </div>
                )}

                {/* Comments Thread (Client Visible Only) */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Client Feedback Thread ({c.comments?.length || 0})
                  </h4>

                  {(!c.comments || c.comments.length === 0) ? (
                    <div className="text-xs text-slate-400 italic">No feedback comments recorded.</div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {c.comments.map((comment: any) => (
                        <div key={comment.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-700">{comment.authorName}</span>
                            <span>{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-slate-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERABLES & PUBLISHED SCHEDULE */}
      {activeTab === "DELIVERABLES" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Content Deliverables</h2>
              <p className="text-xs text-slate-500">Scheduled posts, platforms, and live reach analytics.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {contentPosts.length} Posts Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Post Title</th>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Reach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No content deliverables scheduled yet for this month.
                    </td>
                  </tr>
                ) : (
                  contentPosts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.title}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{p.platform}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                          {p.postType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {p.scheduledDate ? formatDate(p.scheduledDate) : "—"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {p.reach > 0 ? p.reach.toLocaleString("en-IN") : "Pending"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & INVOICES */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Total Social Reach</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {Number(stats?.totalReach ?? 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                Across Instagram, Facebook & LinkedIn
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Social Engagements</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {Number(stats?.totalEngagement ?? 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
                Likes, comments, and shares
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Monthly Retainer</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{Number(client?.monthlyRetainer ?? 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                Package: {client?.activePackage || "Growth Package"}
              </span>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Agency Billing & Retainer Invoices</h3>
                <p className="text-xs text-slate-500">Official tax invoices for monthly agency retainers.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">PDF Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No billing invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-3">{formatDate(inv.issueDate)}</td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          ₹{Number(inv.totalAmount ?? inv.total ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              const printWin = window.open("", "_blank", "width=800,height=700");
                              if (printWin) {
                                const totalAmt = Number(inv.totalAmount ?? inv.total ?? 0);
                                const subAmt = Number(inv.subtotal ?? Math.round(totalAmt / 1.18));
                                const taxAmt = Number(inv.taxAmount ?? totalAmt - subAmt);
                                printWin.document.write(`
                                  <html>
                                    <head>
                                      <title>Invoice ${inv.invoiceNumber}</title>
                                      <style>
                                        body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; }
                                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                                        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                                        th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                                        .totals { margin-top: 24px; text-align: right; }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="header">
                                        <div>
                                          <h2 style="margin:0;">GOODWIN GROW AI</h2>
                                          <p style="margin:4px 0;font-size:12px;color:#64748b;">18% GST Compliant Tax Invoice</p>
                                        </div>
                                        <div style="text-align:right;">
                                          <h3 style="margin:0;">${inv.invoiceNumber}</h3>
                                          <p style="margin:4px 0;font-size:12px;">Issued: ${new Date(inv.issueDate).toLocaleDateString()}</p>
                                          <p style="margin:4px 0;font-size:12px;">Status: ${inv.status}</p>
                                        </div>
                                      </div>
                                      <p style="margin-top:20px;"><strong>Billed To:</strong> ${client?.name || inv.clientName || "Client"}</p>
                                      <table>
                                        <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
                                        <tbody>
                                          ${
                                            Array.isArray(inv.items) && inv.items.length > 0
                                              ? inv.items
                                                  .map(
                                                    (it: any) =>
                                                      `<tr><td>${it.description || "Agency Retainer Services"}</td><td style="text-align:right;">₹${Number(it.amount || subAmt).toLocaleString("en-IN")}</td></tr>`
                                                  )
                                                  .join("")
                                              : `<tr><td>${client?.activePackage || "Agency Retainer Services"}</td><td style="text-align:right;">₹${subAmt.toLocaleString("en-IN")}</td></tr>`
                                          }
                                        </tbody>
                                      </table>
                                      <div class="totals">
                                        <p>Subtotal: ₹${subAmt.toLocaleString("en-IN")}</p>
                                        <p>GST (18%): ₹${taxAmt.toLocaleString("en-IN")}</p>
                                        <h3>Total: ₹${totalAmt.toLocaleString("en-IN")}</h3>
                                      </div>
                                      <script>window.onload = () => { window.print(); };</script>
                                    </body>
                                  </html>
                                `);
                                printWin.document.close();
                              } else {
                                window.print();
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes / Feedback Modal */}
      {feedbackModalOpen && feedbackCreative && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Revisions</h3>
                <p className="text-xs text-slate-500">
                  {feedbackCreative.title} (v{feedbackCreative.version || feedbackCreative.versionNumber || 1})
                </p>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specify Changes Required for Design or Copy *
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Please change the headline to highlight 20% discount instead, and use our official white logo variant..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                Submitting this will change the status to <strong>Changes Requested</strong> and notify your design team.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Changes Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video & Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-sm font-bold truncate">{previewMedia.title}</span>
              <button onClick={() => setPreviewMedia(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black">
              {previewMedia.type === "video" ? (
                <video src={previewMedia.url} controls autoPlay className="max-h-[70vh] rounded-xl" />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[70vh] rounded-xl object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
