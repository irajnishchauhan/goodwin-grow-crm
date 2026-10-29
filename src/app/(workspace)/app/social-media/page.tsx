"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  Heart,
  MessageCircle,
  Eye,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface SocialPost {
  id: string;
  title: string;
  caption?: string | null;
  hashtags?: string | null;
  platform: string;
  postType: string;
  scheduledDate?: string | null;
  status: string;
  mediaUrl?: string | null;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
}

export default function SocialMediaPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("platform", activeTab);

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

  // Aggregate metrics
  const totalReach = posts.reduce((acc, p) => acc + (p.reach || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Social Media Operations & Publishing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Multi-Client Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-platform organic social media, captions, hashtags, Reels, and engagement metrics across all client brands.
          </p>
        </div>

        <Link
          href="/app/content-calendar"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition"
        >
          <Calendar className="w-4 h-4" />
          <span>Open Full Content Calendar</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Organic Reach
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalReach.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            +38% vs previous month
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Engagements
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {(totalLikes + totalComments).toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
            Likes, comments & shares
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Social Accounts
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            18 Channels
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Instagram, FB, LinkedIn & YouTube
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Scheduled Posts
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {posts.length} Posts
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            100% on schedule
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: "ALL", label: "All Channels" },
          { key: "INSTAGRAM", label: "Instagram" },
          { key: "FACEBOOK", label: "Facebook" },
          { key: "LINKEDIN", label: "LinkedIn" },
          { key: "YOUTUBE", label: "YouTube" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading social posts...</div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={post.mediaUrl || "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800"}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-900 shadow-xs">
                    {post.platform} • {post.postType}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {post.status.replace("_", " ")}
                  </div>
                </div>

                <div className="p-5">
                  {post.client && (
                    <div className="text-xs font-bold text-emerald-700 mb-1">
                      {post.client.name}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {post.title}
                  </h3>

                  {post.caption && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{post.caption}"
                    </p>
                  )}

                  {post.hashtags && (
                    <div className="text-[10px] text-indigo-600 font-mono mt-2 truncate">
                      {post.hashtags}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{post.likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>{post.comments}</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : "Scheduled"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
