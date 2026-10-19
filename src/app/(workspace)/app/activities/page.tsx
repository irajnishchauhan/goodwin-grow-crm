"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Phone, Mail, Calendar, MessageSquare, FileText, X, Trash2, Filter, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [performedByFilter, setPerformedByFilter] = useState("ALL");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [type, setType] = useState("CALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [typeFilter, performedByFilter]);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchActivities() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (performedByFilter !== "ALL") params.set("performedById", performedByFilter);

      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setTitle("");
        setDescription("");
        fetchActivities();
      } else {
        alert(data.error || "Failed to log activity");
      }
    } catch {
      alert("Error logging activity");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(activityId: string, activityTitle: string) {
    if (!confirm(`Are you sure you want to delete activity log "${activityTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchActivities();
      } else {
        alert(data.error || "Failed to delete activity log (RBAC permission required)");
      }
    } catch {
      alert("Error deleting activity");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Timeline & Communication</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Close CRM-style communication log for client calls, meetings, emails, and follow-up notes.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Activity</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "CALL", "EMAIL", "MEETING", "WHATSAPP", "NOTE"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                typeFilter === t
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t === "ALL" ? "All Types" : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-600">Employee:</span>
          <select
            value={performedByFilter}
            onChange={(e) => setPerformedByFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Team Members</option>
            <option value="me">👤 Logged by Me</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.primaryRole})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activity timeline...</div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No activities logged yet.</div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 z-10">
                  {act.type === "CALL" && <Phone className="w-4 h-4" />}
                  {act.type === "EMAIL" && <Mail className="w-4 h-4" />}
                  {act.type === "MEETING" && <Calendar className="w-4 h-4" />}
                  {act.type === "WHATSAPP" && <MessageSquare className="w-4 h-4" />}
                  {act.type === "NOTE" && <FileText className="w-4 h-4" />}
                </div>

                <div className="flex-1 bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(act.occurredAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(act.id, act.title)}
                        title="Delete Activity"
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {act.description && (
                    <p className="text-xs text-slate-600">{act.description}</p>
                  )}
                  <div className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Logged by {act.performedBy?.fullName || "Team Member"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Log Interaction</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["CALL", "EMAIL", "MEETING", "WHATSAPP", "NOTE"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        type === t
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Summary *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Discussed bulk battery MOQ terms"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Details & Meeting Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key client questions, pricing discussed, next actions..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {creating ? "Saving..." : "Log Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
