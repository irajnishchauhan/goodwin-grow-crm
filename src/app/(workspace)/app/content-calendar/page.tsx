"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Share2,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Clock,
  Sparkles,
  Building2,
  Filter,
  CheckCircle2,
  Eye,
  X,
  Tag,
  Flame,
  Edit2,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  UserCheck,
  LayoutGrid,
  List,
  Search,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ContentPost {
  id: string;
  title: string;
  caption?: string | null;
  hashtags?: string | null;
  platform: string;
  postType: string;
  scheduledDate?: string | null;
  status: string;
  ownerName?: string | null;
  deadline?: string | null;
  approvalStatus?: string | null;
  isOverdueApproval?: boolean;
  festivalOrEvent?: string | null;
  mediaUrl?: string | null;
  reach: number;
  likes: number;
  comments: number;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

interface MarketingFestival {
  id: string;
  date: string;
  title: string;
  tag: string;
  desc: string;
}

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFormat, setViewFormat] = useState<"GRID" | "LIST">("GRID");
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Marketing Festivals State (Full CRUD)
  const [festivals, setFestivals] = useState<MarketingFestival[]>([]);
  const [festivalsLoading, setFestivalsLoading] = useState(false);
  const [showAllFestivals, setShowAllFestivals] = useState(false);
  const [festivalModalOpen, setFestivalModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<MarketingFestival | null>(null);
  const [festivalForm, setFestivalForm] = useState({
    date: "",
    title: "",
    tag: "Festival",
    desc: "",
  });
  const [savingFestival, setSavingFestival] = useState(false);

  // Create Form State
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [postType, setPostType] = useState("Carousel");
  const [ownerName, setOwnerName] = useState("Kunal Sharma");
  const [deadline, setDeadline] = useState("2026-10-24T18:00");
  const [approvalStatus, setApprovalStatus] = useState("DRAFT");
  const [scheduledDate, setScheduledDate] = useState("2026-10-25T11:00");
  const [festivalOrEvent, setFestivalOrEvent] = useState("Diwali Festive Campaign");
  const [mediaUrl, setMediaUrl] = useState("https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editPlatform, setEditPlatform] = useState("INSTAGRAM");
  const [editPostType, setEditPostType] = useState("Carousel");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editApprovalStatus, setEditApprovalStatus] = useState("DRAFT");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editStatus, setEditStatus] = useState("SCHEDULED");
  const [editFestival, setEditFestival] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchClients();
    fetchFestivals();
  }, [selectedClientId, selectedPlatform]);

  async function fetchFestivals() {
    try {
      setFestivalsLoading(true);
      const res = await fetch("/api/agency/festivals");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFestivals(data.data);
      }
    } catch (err) {
      console.error("Failed to load festivals:", err);
    } finally {
      setFestivalsLoading(false);
    }
  }

  async function handleSaveFestival(e: React.FormEvent) {
    e.preventDefault();
    if (!festivalForm.date.trim() || !festivalForm.title.trim()) {
      alert("Please enter a valid festival date and name");
      return;
    }

    try {
      setSavingFestival(true);
      if (editingFestival) {
        // Optimistic update
        setFestivals((prev) =>
          prev.map((f) => (f.id === editingFestival.id ? { ...f, ...festivalForm } : f))
        );

        const res = await fetch(`/api/agency/festivals/${editingFestival.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(festivalForm),
        });
        const data = await res.json();
        if (data.success) {
          setFestivalModalOpen(false);
          setEditingFestival(null);
          fetchFestivals();
        } else {
          alert(data.error || "Failed to update festival");
          fetchFestivals();
        }
      } else {
        const res = await fetch("/api/agency/festivals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(festivalForm),
        });
        const data = await res.json();
        if (data.success) {
          setFestivalModalOpen(false);
          fetchFestivals();
        } else {
          alert(data.error || "Failed to create festival");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving festival");
    } finally {
      setSavingFestival(false);
    }
  }

  async function handleDeleteFestival(id: string, festivalTitle: string) {
    if (!confirm(`Are you sure you want to delete festival "${festivalTitle}" from the calendar?`)) {
      return;
    }

    // Optimistic UI update
    setFestivals((prev) => prev.filter((f) => f.id !== id));

    try {
      const res = await fetch(`/api/agency/festivals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete festival");
        fetchFestivals();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting festival");
      fetchFestivals();
    }
  }

  async function handleDeleteWrong3Dates() {
    const wrongItems = festivals.filter(
      (f) =>
        f.date.includes("Oct 28") ||
        f.date.includes("Oct 30") ||
        f.date.includes("Nov 02")
    );

    if (wrongItems.length === 0) {
      alert("No incorrect dummy festival dates (Oct 28, Oct 30, Nov 02) found!");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the ${wrongItems.length} incorrect festival dates?\n` +
          wrongItems.map((w) => `• ${w.date} - ${w.title}`).join("\n")
      )
    ) {
      return;
    }

    // Optimistic UI
    const wrongIds = wrongItems.map((w) => w.id);
    setFestivals((prev) => prev.filter((f) => !wrongIds.includes(f.id)));

    for (const w of wrongItems) {
      await fetch(`/api/agency/festivals/${w.id}`, { method: "DELETE" }).catch(() => {});
    }
    fetchFestivals();
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

  async function fetchPosts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClientId !== "ALL") params.set("clientId", selectedClientId);
      if (selectedPlatform !== "ALL") params.set("platform", selectedPlatform);

      const res = await fetch(`/api/agency/calendar?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          caption,
          hashtags,
          clientId: clientId || null,
          platform,
          postType,
          ownerName,
          deadline: deadline ? new Date(deadline) : null,
          approvalStatus,
          scheduledDate: new Date(scheduledDate),
          festivalOrEvent,
          mediaUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComposerOpen(false);
        setTitle("");
        setCaption("");
        fetchPosts();
      } else {
        alert(data.error || "Failed to schedule post");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(post: ContentPost) {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditCaption(post.caption || "");
    setEditHashtags(post.hashtags || "");
    setEditClientId(post.client?.id || "");
    setEditPlatform(post.platform);
    setEditPostType(post.postType);
    setEditOwnerName(post.ownerName || "");
    setEditDeadline(
      post.deadline ? new Date(post.deadline).toISOString().slice(0, 16) : ""
    );
    setEditApprovalStatus(post.approvalStatus || "DRAFT");
    setEditScheduledDate(
      post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : ""
    );
    setEditStatus(post.status);
    setEditFestival(post.festivalOrEvent || "");
    setEditMediaUrl(post.mediaUrl || "");
    setEditModalOpen(true);
  }

  async function handleUpdatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPost) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/agency/calendar/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          caption: editCaption,
          hashtags: editHashtags,
          clientId: editClientId || null,
          platform: editPlatform,
          postType: editPostType,
          ownerName: editOwnerName || null,
          deadline: editDeadline ? new Date(editDeadline) : null,
          approvalStatus: editApprovalStatus,
          status: editStatus,
          festivalOrEvent: editFestival || null,
          mediaUrl: editMediaUrl || null,
          scheduledDate: editScheduledDate ? new Date(editScheduledDate) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingPost(null);
        fetchPosts();
      } else {
        alert(data.error || "Failed to update post");
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      fetchPosts();
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatusChange(postId: string, newApprovalStatus: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, approvalStatus: newApprovalStatus } : p))
    );

    try {
      await fetch(`/api/agency/calendar/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: newApprovalStatus }),
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
      fetchPosts();
    }
  }

  async function handleDeletePost(postId: string, postTitle: string) {
    if (!confirm(`Are you sure you want to delete post "${postTitle}"?`)) return;

    setDeletingId(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      const res = await fetch(`/api/agency/calendar/${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete post");
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      fetchPosts();
    } finally {
      setDeletingId(null);
    }
  }

  function getPlatformIcon(p: string) {
    switch (p) {
      case "INSTAGRAM":
        return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
      case "LINKEDIN":
        return <Linkedin className="w-3.5 h-3.5 text-blue-700" />;
      case "FACEBOOK":
        return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
      case "YOUTUBE":
        return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Share2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  }

  function getApprovalBadge(status?: string | null) {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case "INTERNAL_REVIEW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Internal Review</span>;
      case "CLIENT_REVIEW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">Client Review</span>;
      case "CHANGES_REQUESTED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">Changes Requested</span>;
      case "APPROVED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Approved</span>;
      case "SCHEDULED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Scheduled</span>;
      case "PUBLISHED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Published</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{status || "Scheduled"}</span>;
    }
  }

  // Filter posts based on search and status
  const filteredPosts = posts.filter((p) => {
    if (selectedApprovalStatus !== "ALL" && (p.approvalStatus || p.status) !== selectedApprovalStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchClient = p.client?.name.toLowerCase().includes(q);
      const matchCaption = p.caption?.toLowerCase().includes(q);
      const matchOwner = p.ownerName?.toLowerCase().includes(q);
      return matchTitle || matchClient || matchCaption || matchOwner;
    }
    return true;
  });

  const overdueCount = posts.filter((p) => p.isOverdueApproval).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Marketing Content & Festival Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Full Deliverable Audit View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Displaying client, platform, format, caption, owner, deadline, approval status, and scheduled date together.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{overdueCount} Overdue Approval{overdueCount > 1 ? "s" : ""}</span>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewFormat("GRID")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewFormat === "GRID" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewFormat("LIST")}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewFormat === "LIST" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Detailed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Compose & Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Upcoming Indian Festivals & Cultural Events (Full CRUD) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-amber-200/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Indian Festive Calendar & National Campaign Hooks
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-time marketing calendar hooks. Modify dates, remove incorrect festivals, or add custom brand milestones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick cleaner for incorrect dummy dates if present */}
            {festivals.some(
              (f) =>
                f.date.includes("Oct 28") ||
                f.date.includes("Oct 30") ||
                f.date.includes("Nov 02")
            ) && (
              <button
                type="button"
                onClick={handleDeleteWrong3Dates}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition"
                title="Delete 3 incorrect dummy festival dates"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Delete 3 Wrong Dates</span>
              </button>
            )}

            {festivals.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllFestivals(!showAllFestivals)}
                className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold transition"
              >
                {showAllFestivals ? "Show Top 4" : `View All (${festivals.length})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingFestival(null);
                setFestivalForm({
                  date: "",
                  title: "",
                  tag: "Festival",
                  desc: "",
                });
                setFestivalModalOpen(true);
              }}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Festival / Hook</span>
            </button>
          </div>
        </div>

        {festivalsLoading && festivals.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Loading festival hooks...</span>
          </div>
        ) : festivals.length === 0 ? (
          <div className="p-4 bg-white/80 rounded-xl border border-amber-100 text-center text-xs text-slate-600 space-y-2">
            <p className="font-semibold">No festivals or campaign hooks currently scheduled.</p>
            <button
              type="button"
              onClick={fetchFestivals}
              className="text-xs font-bold text-amber-800 underline"
            >
              Reload festival hooks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(showAllFestivals ? festivals : festivals.slice(0, 4)).map((f) => (
              <div
                key={f.id}
                className="p-3 bg-white/95 rounded-xl border border-amber-100 shadow-xs relative group hover:border-amber-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-amber-600" />
                    <span>{f.date}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {f.tag}
                    </span>
                    {/* Action buttons (always accessible & on hover) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFestival(f);
                          setFestivalForm({
                            date: f.date,
                            title: f.title,
                            tag: f.tag,
                            desc: f.desc,
                          });
                          setFestivalModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition"
                        title="Edit festival date / details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFestival(f.id, f.title)}
                        className="p-1 rounded hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition"
                        title="Delete festival"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 pr-1">{f.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{f.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, caption, owner..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none w-full"
            />
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
            >
              <option value="ALL">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Approval:</span>
            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
            >
              <option value="ALL">All Stages</option>
              <option value="DRAFT">Draft</option>
              <option value="INTERNAL_REVIEW">Internal Review</option>
              <option value="CLIENT_REVIEW">Client Review</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {/* Platform Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {["ALL", "INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE"].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedPlatform === plat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Warning Alert Box (if any) */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-950">
                Action Required: {overdueCount} Content Deliverable Approvals are Overdue
              </h4>
              <p className="text-[11px] text-rose-700">
                The scheduled review deadline has passed without client or internal approval. Expedite reviews to avoid publishing delays.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedApprovalStatus("CLIENT_REVIEW")}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shrink-0"
          >
            Review Pending Posts
          </button>
        </div>
      )}

      {/* Content Posts: CARD GRID VIEW */}
      {viewFormat === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <span>Loading scheduled marketing content...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400">
              No content posts match the selected filters.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-2xl border ${
                  post.isOverdueApproval
                    ? "border-rose-400 ring-2 ring-rose-200 shadow-md"
                    : "border-slate-200/80 shadow-xs"
                } overflow-hidden hover:border-slate-300 transition flex flex-col justify-between group`}
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={post.mediaUrl || "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Platform & Format Tag */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 shadow-xs">
                      {getPlatformIcon(post.platform)}
                      <span>{post.platform} • {post.postType}</span>
                    </div>

                    {/* Overdue Badge */}
                    {post.isOverdueApproval && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-xs animate-bounce">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OVERDUE APPROVAL</span>
                      </div>
                    )}

                    {/* Scheduled Date Pill */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.scheduledDate ? formatDate(post.scheduledDate) : "Scheduled"}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    {/* Client & Approval Status Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-emerald-700 truncate">
                        {post.client ? post.client.name : "Agency Brand"}
                      </div>
                      <div>{getApprovalBadge(post.approvalStatus || post.status)}</div>
                    </div>

                    {/* Post Title */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {post.title}
                    </h3>

                    {/* Festival tag if present */}
                    {post.festivalOrEvent && (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                        {post.festivalOrEvent}
                      </span>
                    )}

                    {/* Caption */}
                    {post.caption && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
                        "{post.caption}"
                      </div>
                    )}

                    {/* Owner & Deadline Row */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Owner:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {post.ownerName || "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Deadline:</span>
                        <span
                          className={`font-semibold flex items-center gap-1 truncate ${
                            post.isOverdueApproval ? "text-rose-600 font-bold" : "text-slate-800"
                          }`}
                        >
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          {post.deadline ? formatDate(post.deadline) : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <select
                    value={post.approvalStatus || post.status}
                    onChange={(e) => handleQuickStatusChange(post.id, e.target.value)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="INTERNAL_REVIEW">Internal Review</option>
                    <option value="CLIENT_REVIEW">Client Review</option>
                    <option value="CHANGES_REQUESTED">Changes Requested</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PUBLISHED">Published</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.title)}
                      disabled={deletingId === post.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                      title="Delete Post"
                    >
                      {deletingId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Content Posts: AUDIT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-4">Post & Caption</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3">Approval Status</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className={`hover:bg-slate-50/80 transition ${
                      post.isOverdueApproval ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {post.client?.name || "General"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getPlatformIcon(post.platform)}
                        <span className="font-medium text-slate-700">{post.platform}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[10px]">
                        {post.postType}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{post.title}</div>
                      {post.caption && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {post.caption}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {post.ownerName || "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className={post.isOverdueApproval ? "text-rose-600 font-bold flex items-center gap-1" : "text-slate-600"}>
                        {post.isOverdueApproval && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{post.deadline ? formatDate(post.deadline) : "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getApprovalBadge(post.approvalStatus || post.status)}
                        {post.isOverdueApproval && (
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">
                            Overdue Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                      {post.scheduledDate ? formatDate(post.scheduledDate) : "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Edit Post"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post Composer Modal (Create) */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Compose & Schedule Post</h3>
                <p className="text-xs text-slate-500">Includes client, format, owner, deadline, and approval lifecycle.</p>
              </div>
              <button onClick={() => setComposerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Post Title / Creative Hook *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Mega Ceramic Coating Flash Sale"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="YOUTUBE">YouTube Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format (Post Type)</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Carousel">Carousel (1080x1350)</option>
                    <option value="Reel / Video">Reel / 9:16 Video</option>
                    <option value="Static Graphic">Static Square (1080x1080)</option>
                    <option value="Story Offer">Story Limited Offer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Content Owner</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Kunal Sharma"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Stage</label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="INTERNAL_REVIEW">Internal Review</option>
                    <option value="CLIENT_REVIEW">Client Review</option>
                    <option value="CHANGES_REQUESTED">Changes Requested</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Deadline</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Publish Date</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caption / Copywriting</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Compelling marketing copy with offer call to action..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Festival / Campaign Tag</label>
                <input
                  type="text"
                  value={festivalOrEvent}
                  onChange={(e) => setFestivalOrEvent(e.target.value)}
                  placeholder="e.g. Dhanteras 2026 Special"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hashtags</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#ceramiccoating #cardetailing #delhicars #diwaliautosale"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Media Asset Preview URL</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
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
                  <span>Schedule Deliverable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Scheduled Post</h3>
                <p className="text-xs text-slate-500">Update creative copy, platform, timing, owner, or approval stage.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Post Title *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Stage</label>
                  <select
                    value={editApprovalStatus}
                    onChange={(e) => setEditApprovalStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="INTERNAL_REVIEW">INTERNAL_REVIEW</option>
                    <option value="CLIENT_REVIEW">CLIENT_REVIEW</option>
                    <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="YOUTUBE">YouTube Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format (Post Type)</label>
                  <select
                    value={editPostType}
                    onChange={(e) => setEditPostType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Carousel">Carousel (1080x1350)</option>
                    <option value="Reel / Video">Reel / 9:16 Video</option>
                    <option value="Static Graphic">Static Square (1080x1080)</option>
                    <option value="Story Offer">Story Limited Offer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Deadline</label>
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Festival / Campaign Tag</label>
                  <input
                    type="text"
                    value={editFestival}
                    onChange={(e) => setEditFestival(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caption / Copywriting</label>
                <textarea
                  rows={3}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hashtags</label>
                <input
                  type="text"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Media Asset Preview URL</label>
                <input
                  type="url"
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
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

      {/* Festival Event Create / Edit Modal (Full CRUD) */}
      {festivalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingFestival ? "Edit Festival / Campaign Hook" : "Add Festival / Campaign Hook"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFestivalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFestival} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Festival Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={festivalForm.date}
                  onChange={(e) => setFestivalForm({ ...festivalForm, date: e.target.value })}
                  placeholder="e.g. Nov 08, 2026 or Oct 20, 2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Tip: Use format &quot;MMM DD, YYYY&quot; like &quot;Nov 08, 2026&quot; for clean calendar display.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Festival / Campaign Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={festivalForm.title}
                  onChange={(e) => setFestivalForm({ ...festivalForm, title: e.target.value })}
                  placeholder="e.g. Diwali (Deepavali) or Dhanteras & Gold Muhurat"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag / Category
                </label>
                <select
                  value={festivalForm.tag}
                  onChange={(e) => setFestivalForm({ ...festivalForm, tag: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="National Festival">National Festival</option>
                  <option value="Major Festive">Major Festive</option>
                  <option value="Regional Festival">Regional Festival</option>
                  <option value="Festival">Festival</option>
                  <option value="E-Commerce">E-Commerce Flash Sale</option>
                  <option value="Holiday">Public Holiday</option>
                  <option value="Global Event">Global Celebration</option>
                  <option value="Brand Milestone">Brand Milestone / Anniversary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marketing Angle / Hook Description
                </label>
                <textarea
                  rows={2}
                  value={festivalForm.desc}
                  onChange={(e) => setFestivalForm({ ...festivalForm, desc: e.target.value })}
                  placeholder="e.g. Grand festive offers, brand greetings, gold & vehicle purchase campaigns"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFestivalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFestival}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                >
                  {savingFestival ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingFestival ? "Update Festival" : "Add to Calendar"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
