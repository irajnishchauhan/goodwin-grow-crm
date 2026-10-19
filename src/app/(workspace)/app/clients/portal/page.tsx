"use client";

import { useState } from "react";
import {
  ExternalLink,
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
} from "lucide-react";

export default function ClientPortalPreviewPage() {
  const [selectedClient, setSelectedClient] = useState("Sapna Washing Point");
  const [approvalStatus, setApprovalStatus] = useState<Record<string, string>>({
    asset1: "APPROVED",
    asset2: "PENDING",
    asset3: "PENDING",
  });
  const [commentInput, setCommentInput] = useState("");

  const pendingCreatives = [
    {
      id: "asset1",
      title: "Diwali 30% Off Detailing Spa Carousel",
      type: "Instagram 5-Slide Carousel (1080x1350)",
      imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
      caption: "Get your car festival-ready with our 5-stage ceramic spa! Prior booking recommended.",
      scheduledDate: "Oct 28, 2026",
      designer: "Pooja Verma",
    },
    {
      id: "asset2",
      title: "Foam Wash ASMR & Ceramic Water Repellency Reel",
      type: "Vertical 9:16 Reel (1080x1920)",
      imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      caption: "Watch that water sheet right off! 🚗💦 9H Ceramic coating protects against acid rain and oxidation.",
      scheduledDate: "Oct 24, 2026",
      designer: "Deepak Joshi",
    },
    {
      id: "asset3",
      title: "Sunday Car Maintenance Checklist Infographic",
      type: "Instagram Feed Post (1080x1080)",
      imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
      caption: "5 quick checks before your weekend road trip. Tyre pressure, windshield wash, and battery terminals.",
      scheduledDate: "Nov 02, 2026",
      designer: "Pooja Verma",
    },
  ];

  function handleAction(id: string, action: string) {
    setApprovalStatus((prev) => ({ ...prev, [id]: action }));
  }

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Client Portal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Client Portal Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Client Portal & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            This is the branded approval workspace your clients access to preview upcoming creatives, read copy briefs, submit revisions, and give 1-click publishing authorization.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs text-slate-400">Simulating as Client:</span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/20 focus:outline-none"
            >
              <option value="Sapna Washing Point" className="text-slate-900">Sapna Washing Point</option>
              <option value="Maa Amba Foam & Furnishing" className="text-slate-900">Maa Amba Foam & Furnishing</option>
              <option value="ZestPure Wellness" className="text-slate-900">ZestPure Wellness</option>
              <option value="FinEdge App" className="text-slate-900">FinEdge App</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Deliverables Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            {selectedClient.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{selectedClient} — October 2026 Deliverables</h3>
            <p className="text-xs text-slate-500">8 of 12 posts approved and published</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "67%" }} />
          </div>
          <span className="text-xs font-bold text-emerald-700">67% Completed</span>
        </div>
      </div>

      {/* Creatives Awaiting Client Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Creatives Awaiting Your Review</span>
          </h2>
          <span className="text-xs text-slate-400">3 deliverables pending approval</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pendingCreatives.map((item) => {
            const currentStatus = approvalStatus[item.id] || "PENDING";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-slate-100 overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {item.type}
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]">
                      {item.scheduledDate}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      {currentStatus === "APPROVED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          Approved
                        </span>
                      ) : currentStatus === "CHANGES_REQUESTED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          Changes Asked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3 leading-relaxed">
                      "{item.caption}"
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item.id, "APPROVED")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      currentStatus === "APPROVED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{currentStatus === "APPROVED" ? "Approved!" : "Approve"}</span>
                  </button>

                  <button
                    onClick={() => handleAction(item.id, "CHANGES_REQUESTED")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      currentStatus === "CHANGES_REQUESTED"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
