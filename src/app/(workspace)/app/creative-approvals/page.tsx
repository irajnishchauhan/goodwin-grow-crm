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
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Asset Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState("Social Graphic");
  const [dimensions, setDimensions] = useState("1080x1080");
  const [fileUrl, setFileUrl] = useState("https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800");
  const [clientId, setClientId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("Creative Team");

  // Edit Asset Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CreativeAsset | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAssetType, setEditAssetType] = useState("Social Graphic");
  const [editDimensions, setEditDimensions] = useState("1080x1080");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editStatus, setEditStatus] = useState("PENDING");

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

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
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
          clientId: clientId || null,
          submittedBy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewModalOpen(false);
        setTitle("");
        fetchAssets();
      } else {
        alert(data.error || "Failed to submit creative asset");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(item: CreativeAsset) {
    setEditingAsset(item);
    setEditTitle(item.title);
    setEditAssetType(item.assetType);
    setEditDimensions(item.dimensions || "1080x1080");
    setEditFileUrl(item.fileUrl || "");
    setEditClientId(item.client?.id || "");
    setEditStatus(item.reviewStatus);
    setEditModalOpen(true);
  }

  async function handleUpdateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAsset) return;
    setSaving(true);

    // Optimistic UI update
    setAssets((prev) =>
      prev.map((a) =>
        a.id === editingAsset.id
          ? {
              ...a,
              title: editTitle,
              assetType: editAssetType,
              dimensions: editDimensions,
              fileUrl: editFileUrl,
              reviewStatus: editStatus,
            }
          : a
      )
    );

    try {
      const res = await fetch(`/api/agency/creatives/${editingAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          assetType: editAssetType,
          dimensions: editDimensions,
          fileUrl: editFileUrl,
          clientId: editClientId || null,
          reviewStatus: editStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingAsset(null);
        fetchAssets();
      } else {
        alert(data.error || "Failed to update asset");
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
      fetchAssets();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string, feedback?: string) {
    // Optimistic update
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              reviewStatus: newStatus,
              clientFeedback: feedback !== undefined ? feedback : a.clientFeedback,
            }
          : a
      )
    );

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
      fetchAssets();
    }
  }

  async function handleDeleteAsset(id: string, assetTitle: string) {
    if (!confirm(`Are you sure you want to delete creative asset "${assetTitle}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setAssets((prev) => prev.filter((a) => a.id !== id));

    try {
      const res = await fetch(`/api/agency/creatives/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete asset");
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
      fetchAssets();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <button
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Creative</span>
        </button>
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
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={item.fileUrl || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                    {item.dimensions || "1080x1080"} • v{item.version}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
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
                  <div className="flex items-center justify-between mb-1">
                    {item.client && (
                      <div className="text-[11px] font-bold text-emerald-700 truncate">
                        {item.client.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                        title="Delete Asset"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

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

      {/* Create New Creative Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit New Creative Asset</h3>
                <p className="text-xs text-slate-500">Add asset for internal and client review.</p>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select an enrolled client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Fest Car Care 4-Slide Carousel"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Social Graphic">Social Graphic</option>
                    <option value="Reel / Short">Reel / Video Short</option>
                    <option value="Carousel Slide">Carousel Slide</option>
                    <option value="Ad Creative">Meta / Google Ad</option>
                    <option value="Print / Banner">Print / Outdoor Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dimensions</label>
                  <select
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="1080x1080">1080x1080 (Square)</option>
                    <option value="1080x1350">1080x1350 (Portrait 4:5)</option>
                    <option value="1080x1920">1080x1920 (Story/Reel 9:16)</option>
                    <option value="1200x628">1200x628 (Landscape)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Image URL</label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Submitted By</label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Creative Modal */}
      {editModalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Creative Asset</h3>
                <p className="text-xs text-slate-500">Update title, dimensions, format, or review status.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="CHANGES_REQUESTED">CHANGES REQUESTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client</label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">No Client / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type</label>
                  <select
                    value={editAssetType}
                    onChange={(e) => setEditAssetType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Social Graphic">Social Graphic</option>
                    <option value="Reel / Short">Reel / Video Short</option>
                    <option value="Carousel Slide">Carousel Slide</option>
                    <option value="Ad Creative">Meta / Google Ad</option>
                    <option value="Print / Banner">Print / Outdoor Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dimensions</label>
                  <select
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="1080x1080">1080x1080</option>
                    <option value="1080x1350">1080x1350</option>
                    <option value="1080x1920">1080x1920</option>
                    <option value="1200x628">1200x628</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Image URL</label>
                <input
                  type="url"
                  value={editFileUrl}
                  onChange={(e) => setEditFileUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
