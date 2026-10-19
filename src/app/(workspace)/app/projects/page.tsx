"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Sparkles,
  Building2,
  X,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  deliverableType: string;
  status: string;
  budget: number;
  startDate?: string | null;
  dueDate?: string | null;
  assigneeName?: string | null;
  progressPercent: number;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
  } | null;
  _count?: {
    tasks: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<any[]>([]);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [deliverableType, setDeliverableType] = useState("Monthly Retainer Deliverable");
  const [budget, setBudget] = useState("50000");
  const [dueDate, setDueDate] = useState("");
  const [assigneeName, setAssigneeName] = useState("Kunal Sharma");

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editStatus, setEditStatus] = useState("IN_PROGRESS");
  const [editBudget, setEditBudget] = useState("50000");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editProgress, setEditProgress] = useState(50);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success) setClients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchProjects() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          clientId,
          deliverableType,
          budget,
          dueDate,
          assigneeName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName("");
        setDescription("");
        fetchProjects();
      } else {
        alert(data.error || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(p: Project) {
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setEditClientId(p.client?.id || "");
    setEditStatus(p.status);
    setEditBudget(String(p.budget));
    setEditDueDate(p.dueDate ? p.dueDate.slice(0, 10) : "");
    setEditAssignee(p.assigneeName || "");
    setEditProgress(p.progressPercent);
    setEditModalOpen(true);
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProject) return;
    setSaving(true);

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: editName,
              description: editDesc,
              status: editStatus,
              budget: Number(editBudget),
              assigneeName: editAssignee,
              progressPercent: editProgress,
              dueDate: editDueDate || null,
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/agency/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          clientId: editClientId,
          status: editStatus,
          budget: editBudget,
          progressPercent: editProgress,
          assigneeName: editAssignee,
          dueDate: editDueDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        alert(data.error || "Failed to update project");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
      fetchProjects();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/agency/projects/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete project");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
      fetchProjects();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleQuickStatus(id: string, newStatus: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              progressPercent: newStatus === "COMPLETED" ? 100 : p.progressPercent,
            }
          : p
      )
    );

    try {
      await fetch(`/api/agency/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          progressPercent: newStatus === "COMPLETED" ? 100 : undefined,
        }),
      });
    } catch (e) {
      console.error(e);
      fetchProjects();
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client?.name && p.client.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Project Delivery
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ClickUp & monday Inspired
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track client campaigns, monthly deliverables, milestone completion, and team execution.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Agency Project</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing <span className="font-semibold text-slate-800">{filteredProjects.length}</span> active projects
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading agency projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No projects found</h3>
            <p className="text-xs text-slate-400 mt-1">Get started by creating a new client project.</p>
          </div>
        ) : (
          filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <FolderKanban className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        {p.client?.name || "Goodwin Agency"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {p.name}
                      </h3>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id, p.name)}
                      disabled={deletingId === p.id}
                      title="Delete Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <select
                    value={p.status}
                    onChange={(e) => handleQuickStatus(p.id, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer ${
                      p.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : p.status === "IN_PROGRESS"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>

                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ₹{Number(p.budget).toLocaleString("en-IN")}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Completion</span>
                    <span className="text-emerald-600 font-bold">{p.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{p.assigneeName || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "Ongoing"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Agency Project</h3>
                <p className="text-xs text-slate-500">Initiate a deliverable workflow for a client.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. October 2026 Festive Detailing Campaign"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">Select an enrolled client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.activePackage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable Type
                </label>
                <select
                  value={deliverableType}
                  onChange={(e) => setDeliverableType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="Monthly Retainer Deliverable">Monthly Retainer Deliverable</option>
                  <option value="360° Creative & Meta Ads">360° Creative & Meta Ads</option>
                  <option value="Performance Marketing">Performance Marketing</option>
                  <option value="SEO & Website Launch">SEO & Website Launch</option>
                  <option value="Brand Identity Pod">Brand Identity Pod</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope & Deliverable Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, deliverables, video counts..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Project</h3>
                <p className="text-xs text-slate-500">Update project scope, progress, or assignment.</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Progress ({editProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full h-2 mt-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
