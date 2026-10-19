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
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  Play,
  Film,
  FileImage,
  ArrowRight,
  SplitSquareVertical,
  AlertTriangle,
  Lock,
  Globe,
  Send,
  Calendar,
  Search,
} from "lucide-react";

interface CreativeVersion {
  id: string;
  versionNumber: number;
  fileUrl: string;
  mediaType: string;
  changelog?: string | null;
  submittedBy?: string | null;
  createdAt: string;
}

interface CreativeComment {
  id: string;
  versionNumber: number;
  authorName: string;
  authorRole?: string | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface CreativeAsset {
  id: string;
  title: string;
  assetType: string;
  dimensions?: string | null;
  fileUrl?: string | null;
  mediaType?: string | null;
  version: number;
  reviewStatus: string;
  clientFeedback?: string | null;
  submittedBy?: string | null;
  approverName?: string | null;
  approverEmail?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
  versions?: CreativeVersion[];
  comments?: CreativeComment[];
}

const STAGES = [
  { id: "ALL", label: "All Stages", countBadge: null },
  { id: "DRAFT", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { id: "INTERNAL_REVIEW", label: "Internal Review", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "CLIENT_REVIEW", label: "Client Review", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "CHANGES_REQUESTED", label: "Changes Requested", color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "APPROVED", label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "SCHEDULED", label: "Scheduled", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  { id: "PUBLISHED", label: "Published", color: "bg-purple-100 text-purple-800 border-purple-300" },
];

export default function CreativeApprovalsPage() {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Review & Detail Modal
  const [reviewModalAsset, setReviewModalAsset] = useState<CreativeAsset | null>(null);
  const [activeVersionTab, setActiveVersionTab] = useState<number>(1);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Compare Revisions Modal
  const [compareAsset, setCompareAsset] = useState<CreativeAsset | null>(null);

  // Upload New Version Modal
  const [versionModalAsset, setVersionModalAsset] = useState<CreativeAsset | null>(null);
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionMediaType, setNewVersionMediaType] = useState("image");
  const [newVersionChangelog, setNewVersionChangelog] = useState("");

  // New Asset Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState("Social Graphic");
  const [dimensions, setDimensions] = useState("1080x1080");
  const [fileUrl, setFileUrl] = useState("https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800");
  const [mediaType, setMediaType] = useState("image");
  const [clientId, setClientId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("Creative Pod");
  const [initialStage, setInitialStage] = useState("INTERNAL_REVIEW");

  useEffect(() => {
    fetchClients();
    fetchAssets();
  }, [selectedClientId, statusFilter]);

  function showToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }

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
      } else {
        showToast(data.error || "Failed to fetch creatives", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agency/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          assetType,
          dimensions,
          fileUrl,
          mediaType,
          clientId: clientId || null,
          submittedBy,
          reviewStatus: initialStage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewModalOpen(false);
        setTitle("");
        showToast("Creative asset created successfully!");
        fetchAssets();
      } else {
        showToast(data.error || "Failed to create creative asset", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating creative", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusTransition(assetId: string, targetStatus: string, note?: string) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/creatives/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewStatus: targetStatus,
          clientFeedback: note || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Asset transitioned to ${targetStatus.replace("_", " ")}!`);
        if (reviewModalAsset && reviewModalAsset.id === assetId) {
          setReviewModalAsset(data.data);
        }
        fetchAssets();
      } else {
        showToast(data.error || "Failed to transition stage", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to transition stage", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadNewVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!versionModalAsset || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/creatives/${versionModalAsset.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: newVersionUrl,
          mediaType: newVersionMediaType,
          changelog: newVersionChangelog,
          submittedBy: "Lead Designer",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVersionModalAsset(null);
        setNewVersionUrl("");
        setNewVersionChangelog("");
        showToast("Revised version uploaded! Review status reset to Internal Review for fresh approval.");
        fetchAssets();
      } else {
        showToast(data.error || "Failed to upload version", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error uploading version", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(assetId: string) {
    if (!feedbackInput.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/creatives/${assetId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber: activeVersionTab,
          content: feedbackInput.trim(),
          isInternal: isInternalComment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackInput("");
        showToast(isInternalComment ? "Internal agency note added" : "Client-visible comment posted");
        // refresh asset detail
        const refRes = await fetch(`/api/agency/creatives/${assetId}`);
        const refData = await refRes.json();
        if (refData.success) {
          setReviewModalAsset(refData.data);
        }
        fetchAssets();
      } else {
        showToast(data.error || "Failed to add comment", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error submitting comment", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAsset(id: string, assetTitle: string) {
    if (!confirm(`Are you sure you want to delete "${assetTitle}"?`)) return;
    try {
      const res = await fetch(`/api/agency/creatives/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Creative deleted successfully");
        fetchAssets();
      } else {
        showToast(data.error || "Failed to delete asset", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error deleting asset", "error");
    }
  }

  const filteredAssets = assets.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.client?.name.toLowerCase().includes(q) ||
      a.submittedBy?.toLowerCase().includes(q) ||
      a.assetType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-950 text-emerald-200 border-emerald-800"
              : "bg-rose-950 text-rose-200 border-rose-800"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Creative Approvals & Asset Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              7-Stage Approval Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Draft &rarr; Internal Review &rarr; Client Review &rarr; Changes Requested &rarr; Approved &rarr; Scheduled &rarr; Published.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Creative Asset</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets, clients, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
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
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredAssets.length}</span> of {assets.length} assets
        </div>
      </div>

      {/* 7-Stage Workflow Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STAGES.map((st) => {
          const count = st.id === "ALL" ? assets.length : assets.filter((a) => a.reviewStatus === st.id).length;
          const isActive = statusFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <span className="text-xs text-slate-500 font-medium">Loading creative assets...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 text-center">
          <Layers className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No creative assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No assets match your search or filter. Submit a new creative brief or select a different review stage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isVideo = asset.mediaType === "video" || asset.fileUrl?.match(/\.(mp4|webm|mov)(\?|$)/i);
            const statusStage = STAGES.find((s) => s.id === asset.reviewStatus) || {
              label: asset.reviewStatus,
              color: "bg-slate-100 text-slate-700 border-slate-300",
            };

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition group"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                      <video
                        src={asset.fileUrl || undefined}
                        className="w-full h-full object-cover opacity-80"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                        <Film className="w-3 h-3 text-cyan-400" /> Video
                      </span>
                    </div>
                  ) : (
                    <img
                      src={asset.fileUrl || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800"}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                  )}

                  {/* Version Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-black backdrop-blur-md border border-white/20">
                      v{asset.version}
                    </span>
                    {asset.versions && asset.versions.length > 1 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-extrabold">
                        {asset.versions.length} revisions
                      </span>
                    )}
                  </div>

                  {/* Review Status Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs ${statusStage.color}`}
                  >
                    {statusStage.label}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider flex items-center justify-between">
                      <span>{asset.client?.name || "Goodwin Grow AI"}</span>
                      <span>{asset.dimensions || "1080x1080"}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {asset.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{asset.assetType}</p>

                    {/* Approver Record info if Approved */}
                    {asset.reviewStatus === "APPROVED" && (
                      <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved by {asset.approverName || "Client Lead"}</span>
                        </div>
                        {asset.approvedAt && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            {new Date(asset.approvedAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback Alert if Changes Requested */}
                    {asset.reviewStatus === "CHANGES_REQUESTED" && asset.clientFeedback && (
                      <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-900 line-clamp-2">
                        <span className="font-bold">Feedback: </span>
                        <span>{asset.clientFeedback}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setReviewModalAsset(asset);
                        setActiveVersionTab(asset.version);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review / Approve</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Compare revisions button if > 1 version */}
                      {asset.versions && asset.versions.length > 1 && (
                        <button
                          onClick={() => setCompareAsset(asset)}
                          title="Compare Versions Side-by-Side"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <SplitSquareVertical className="w-4 h-4" />
                        </button>
                      )}

                      {/* Upload new version */}
                      <button
                        onClick={() => {
                          setVersionModalAsset(asset);
                          setNewVersionUrl("");
                          setNewVersionChangelog("");
                        }}
                        title="Upload Revised Version"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAsset(asset.id, asset.title)}
                        title="Delete Asset"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 1. Review & Approve Detail Modal (with Image/Video preview & comments)    */}
      {/* ========================================================================= */}
      {reviewModalAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {reviewModalAsset.client?.name || "Client"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                    Stage: {reviewModalAsset.reviewStatus.replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">{reviewModalAsset.title}</h2>
              </div>
              <button
                onClick={() => setReviewModalAsset(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 columns */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Media Preview & Version Tabs (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Version Selector Tabs */}
                {reviewModalAsset.versions && reviewModalAsset.versions.length > 1 && (
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-400 mr-1">Revisions:</span>
                    {reviewModalAsset.versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setActiveVersionTab(v.versionNumber)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeVersionTab === v.versionNumber
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        v{v.versionNumber}
                      </button>
                    ))}
                  </div>
                )}

                {/* Media Preview Box */}
                {(() => {
                  const currentVer =
                    reviewModalAsset.versions?.find((v) => v.versionNumber === activeVersionTab) ||
                    reviewModalAsset;
                  const isVideo =
                    currentVer.mediaType === "video" ||
                    currentVer.fileUrl?.match(/\.(mp4|webm|mov)(\?|$)/i);

                  return (
                    <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center relative min-h-[280px]">
                      {isVideo ? (
                        <video
                          src={currentVer.fileUrl || undefined}
                          controls
                          className="w-full max-h-[380px] object-contain rounded-2xl"
                        />
                      ) : (
                        <img
                          src={currentVer.fileUrl || undefined}
                          alt={reviewModalAsset.title}
                          className="w-full max-h-[380px] object-contain"
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Version Changelog */}
                {(() => {
                  const currentVer = reviewModalAsset.versions?.find(
                    (v) => v.versionNumber === activeVersionTab
                  );
                  return (
                    currentVer?.changelog && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">Changelog for v{activeVersionTab}: </span>
                        {currentVer.changelog}
                      </div>
                    )
                  );
                })()}

                {/* Stage Progression Action Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Workflow Actions
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {reviewModalAsset.reviewStatus === "DRAFT" && (
                      <button
                        onClick={() => handleStatusTransition(reviewModalAsset.id, "INTERNAL_REVIEW")}
                        disabled={saving}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Send to Internal Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {reviewModalAsset.reviewStatus === "INTERNAL_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(reviewModalAsset.id, "CLIENT_REVIEW")}
                          disabled={saving}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Internal Pass &rarr; Send to Client</span>
                        </button>
                        <button
                          onClick={() => handleStatusTransition(reviewModalAsset.id, "CHANGES_REQUESTED", "Internal changes needed")}
                          disabled={saving}
                          className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          Request Internal Changes
                        </button>
                      </>
                    )}

                    {reviewModalAsset.reviewStatus === "CLIENT_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(reviewModalAsset.id, "APPROVED")}
                          disabled={saving}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Creative (Client Green Light)</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Enter specific feedback or revision requested by client:");
                            if (reason) handleStatusTransition(reviewModalAsset.id, "CHANGES_REQUESTED", reason);
                          }}
                          disabled={saving}
                          className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition cursor-pointer"
                        >
                          Request Changes
                        </button>
                      </>
                    )}

                    {reviewModalAsset.reviewStatus === "APPROVED" && (
                      <button
                        onClick={() => handleStatusTransition(reviewModalAsset.id, "SCHEDULED")}
                        disabled={saving}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Move to Scheduled</span>
                      </button>
                    )}

                    {reviewModalAsset.reviewStatus === "SCHEDULED" && (
                      <button
                        onClick={() => handleStatusTransition(reviewModalAsset.id, "PUBLISHED")}
                        disabled={saving}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Mark as Published</span>
                      </button>
                    )}

                    {/* Upload new version shortcut */}
                    <button
                      onClick={() => {
                        setVersionModalAsset(reviewModalAsset);
                        setNewVersionUrl("");
                        setNewVersionChangelog("");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs transition cursor-pointer ml-auto flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Revision (v{reviewModalAsset.version + 1})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Feedback & Version Comments (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between border-l border-slate-200/80 pl-0 lg:pl-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Feedback & Discussion History</span>
                  </h4>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {reviewModalAsset.comments && reviewModalAsset.comments.length > 0 ? (
                      reviewModalAsset.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className={`p-3 rounded-2xl border text-xs space-y-1 ${
                            comm.isInternal
                              ? "bg-amber-50/70 border-amber-200 text-amber-950"
                              : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              {comm.isInternal ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-extrabold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Internal Agency Note
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 font-extrabold flex items-center gap-0.5">
                                  <Globe className="w-2.5 h-2.5" /> Client Visible
                                </span>
                              )}
                              <span>• {comm.authorName}</span>
                            </span>
                            <span className="text-slate-400">v{comm.versionNumber}</span>
                          </div>
                          <p className="leading-relaxed">{comm.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                        No comments yet for this creative.
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Comment Box */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Add Feedback / Note:</span>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-0"
                      />
                      <span>Internal Agency Note (Hidden from Client)</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={
                        isInternalComment
                          ? "Type internal team instruction..."
                          : "Type client feedback on this creative..."
                      }
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(reviewModalAsset.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <button
                      onClick={() => handleAddComment(reviewModalAsset.id)}
                      disabled={saving || !feedbackInput.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Compare Revisions Modal (Side-by-Side Version Comparator)             */}
      {/* ========================================================================= */}
      {compareAsset && compareAsset.versions && compareAsset.versions.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                  <SplitSquareVertical className="w-4 h-4" /> Side-by-Side Revision Comparator
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">{compareAsset.title}</h2>
              </div>
              <button
                onClick={() => setCompareAsset(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1">
              {/* Previous Version (e.g. v1) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 font-black text-xs">
                    Revision v{compareAsset.versions[compareAsset.versions.length - 1].versionNumber} (Earlier)
                  </span>
                  <span className="text-xs text-slate-400">
                    {compareAsset.versions[compareAsset.versions.length - 1].submittedBy}
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
                  <img
                    src={compareAsset.versions[compareAsset.versions.length - 1].fileUrl}
                    alt="Earlier revision"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-600 italic">
                  "{compareAsset.versions[compareAsset.versions.length - 1].changelog || "Initial draft"}"
                </p>
              </div>

              {/* Latest Version */}
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-black text-xs">
                    Revision v{compareAsset.versions[0].versionNumber} (Current Latest)
                  </span>
                  <span className="text-xs text-emerald-700 font-bold">
                    {compareAsset.versions[0].submittedBy}
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
                  <img
                    src={compareAsset.versions[0].fileUrl}
                    alt="Latest revision"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-800 font-medium">
                  "{compareAsset.versions[0].changelog || "Latest client revisions applied"}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Upload New Version Modal (Requires Fresh Approval)                     */}
      {/* ========================================================================= */}
      {versionModalAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  Revision v{versionModalAsset.version + 1}
                </span>
                <h3 className="text-base font-bold text-slate-900">Upload Revised Creative</h3>
              </div>
              <button
                onClick={() => setVersionModalAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Fresh Approval Requirement:</strong> Submitting a revised version resets the review status to Internal Review for rigorous quality assurance.
              </span>
            </div>

            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Revised Asset URL (Image or MP4 Video)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newVersionUrl}
                  onChange={(e) => {
                    setNewVersionUrl(e.target.value);
                    if (e.target.value.match(/\.(mp4|webm|mov)(\?|$)/i)) {
                      setNewVersionMediaType("video");
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Media Type</label>
                <select
                  value={newVersionMediaType}
                  onChange={(e) => setNewVersionMediaType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="image">Static Image Graphic</option>
                  <option value="video">Vertical Reel / Video (HTML5)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  What changed in this revision? (Changelog)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Enlarged coupon text by 20%, corrected brand hex color, updated weekend booking disclaimer."
                  value={newVersionChangelog}
                  onChange={(e) => setNewVersionChangelog(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVersionModalAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Revision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. New Creative Asset Modal                                              */}
      {/* ========================================================================= */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Creative Asset</h3>
              <button onClick={() => setNewModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festive Offer Carousel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Client Organization *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Format Type</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Social Graphic">Feed Poster</option>
                    <option value="Carousel">5-Slide Carousel</option>
                    <option value="Vertical Reel">Vertical 9:16 Reel</option>
                    <option value="Infographic">Infographic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Media URL</label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => {
                    setFileUrl(e.target.value);
                    if (e.target.value.match(/\.(mp4|webm|mov)(\?|$)/i)) {
                      setMediaType("video");
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Media Format</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="image">Static Image</option>
                    <option value="video">MP4 Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stage</label>
                  <select
                    value={initialStage}
                    onChange={(e) => setInitialStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="INTERNAL_REVIEW">Internal Review</option>
                    <option value="CLIENT_REVIEW">Client Review</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Creative</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
