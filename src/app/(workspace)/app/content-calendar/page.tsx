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
} from "lucide-react";

interface ContentPost {
  id: string;
  title: string;
  caption?: string | null;
  hashtags?: string | null;
  platform: string;
  postType: string;
  scheduledDate?: string | null;
  status: string;
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

const indianFestivals2026 = [
  { date: "Oct 20, 2026", title: "Dussehra / Vijayadashami", tag: "Festival", desc: "Auspicious new vehicle & home purchase campaigns" },
  { date: "Oct 28, 2026", title: "Dhanteras & Gold Muhurat", tag: "Major Festive", desc: "Vehicle detailing & gold jewellery festive offers" },
  { date: "Oct 30, 2026", title: "Diwali (Deepavali)", tag: "National Festival", desc: "Grand festive sales, brand greetings & holiday offers" },
  { date: "Nov 02, 2026", title: "Bhai Dooj", tag: "Festival", desc: "Gifting and family celebration creative campaigns" },
  { date: "Nov 06, 2026", title: "Chhath Puja", tag: "Regional Festival", desc: "Bihar & UP vernacular campaigns and solar celebrations" },
  { date: "Nov 27, 2026", title: "Black Friday & Cyber Weekend", tag: "E-Commerce", desc: "D2C brands mega flash sale campaigns" },
  { date: "Dec 25, 2026", title: "Christmas & Year-End Countdown", tag: "Holiday", desc: "Year-end party packages & wellness resolutions" },
];

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Form State
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [postType, setPostType] = useState("Carousel");
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
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editStatus, setEditStatus] = useState("SCHEDULED");
  const [editFestival, setEditFestival] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchClients();
  }, [selectedClientId, selectedPlatform]);

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

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              title: editTitle,
              caption: editCaption,
              hashtags: editHashtags,
              platform: editPlatform,
              postType: editPostType,
              status: editStatus,
              festivalOrEvent: editFestival,
              mediaUrl: editMediaUrl,
              scheduledDate: editScheduledDate || null,
            }
          : p
      )
    );

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

  async function handleQuickStatusChange(postId: string, newStatus: string) {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    try {
      await fetch(`/api/agency/calendar/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchPosts();
    }
  }

  async function handleDeletePost(postId: string, postTitle: string) {
    if (!confirm(`Are you sure you want to delete post "${postTitle}"?`)) return;

    setDeletingId(postId);
    // Optimistic remove
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
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case "LINKEDIN":
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      case "FACEBOOK":
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case "YOUTUBE":
        return <Youtube className="w-4 h-4 text-red-600" />;
      default:
        return <Share2 className="w-4 h-4 text-slate-600" />;
    }
  }

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
              Agency Operating System
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pre-scheduled Indian festivals, national brand campaigns, multi-client social scheduling, and deliverable tracking.
          </p>
        </div>

        <button
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Compose & Schedule Post</span>
        </button>
      </div>

      {/* Upcoming Indian Festivals & Cultural Events 2026 */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-amber-200/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Indian Festive Calendar & National Campaign Hooks (Q4 2026)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
            Auto-synced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {indianFestivals2026.slice(0, 4).map((f, i) => (
            <div key={i} className="p-3 bg-white/90 rounded-xl border border-amber-100 shadow-xs">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-amber-900">{f.date}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {f.tag}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">{f.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Filter Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
          >
            <option value="ALL">All Agency Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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

      {/* Posts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-4 text-center py-12 text-slate-400">Loading scheduled posts...</div>
        ) : posts.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-slate-400">No content posts found for this view.</div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between group"
            >
              <div>
                {/* Media Preview Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={post.mediaUrl || "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 shadow-xs">
                    {getPlatformIcon(post.platform)}
                    <span>{post.postType}</span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-medium">
                    {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : "Scheduled"}
                  </div>
                </div>

                <div className="p-4">
                  {post.client && (
                    <div className="text-[11px] font-bold text-emerald-700 mb-1 truncate">
                      {post.client.name}
                    </div>
                  )}

                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                    {post.title}
                  </h3>

                  {post.festivalOrEvent && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                      {post.festivalOrEvent}
                    </span>
                  )}

                  {post.caption && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Action Controls */}
              <div className="p-4 pt-2 border-t border-slate-100 mt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {/* Quick Status Selector */}
                  <select
                    value={post.status}
                    onChange={(e) => handleQuickStatusChange(post.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                      post.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : post.status === "SCHEDULED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : post.status === "ARCHIVED"
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>

                  <span className="text-[10px] font-medium text-slate-400">
                    {post.reach > 0 ? `${post.reach.toLocaleString()} reach` : "Ready"}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
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

      {/* Post Composer Modal (Create) */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Compose & Schedule Post</h3>
                <p className="text-xs text-slate-500">Multi-channel creative delivery for agency clients.</p>
              </div>
              <button onClick={() => setComposerOpen(false)} className="p-1.5 rounded-lg text-slate-400">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Post Type</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
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
                <p className="text-xs text-slate-500">Update creative copy, platform, timing, or status.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Post Type</label>
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
    </div>
  );
}
