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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [deliverableType, setDeliverableType] = useState("Monthly Retainer Deliverable");
  const [budget, setBudget] = useState("50000");
  const [dueDate, setDueDate] = useState("");
  const [assigneeName, setAssigneeName] = useState("");

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

  // Workflow Tasks Kanban State
  const [agencyTasks, setAgencyTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskStage, setNewTaskStage] = useState("CONTENT_BRIEF");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskClientId, setNewTaskClientId] = useState("");

  // Edit Workflow Task Modal State
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskStage, setEditTaskStage] = useState("CONTENT_BRIEF");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskProjectId, setEditTaskProjectId] = useState("");
  const [editTaskClientId, setEditTaskClientId] = useState("");

  const workflowStages = [
    { key: "CONTENT_BRIEF", label: "1. Content Brief", color: "bg-blue-50 text-blue-800 border-blue-200" },
    { key: "COPYWRITING", label: "2. Copywriting", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
    { key: "DESIGN", label: "3. Design & Motion", color: "bg-purple-50 text-purple-800 border-purple-200" },
    { key: "INTERNAL_REVIEW", label: "4. Internal Review", color: "bg-amber-50 text-amber-800 border-amber-200" },
    { key: "CLIENT_APPROVAL", label: "5. Client Approval", color: "bg-rose-50 text-rose-800 border-rose-200" },
    { key: "SCHEDULED", label: "6. Scheduled", color: "bg-teal-50 text-teal-800 border-teal-200" },
    { key: "PUBLISHED", label: "7. Published", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  ];

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchTeam();
    fetchAgencyTasks();
  }, []);

  async function fetchAgencyTasks() {
    try {
      const res = await fetch("/api/agency/tasks");
      const data = await res.json();
      if (data.success) setAgencyTasks(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function openEditTaskModal(t: any) {
    setEditingTask(t);
    setEditTaskTitle(t.title || "");
    setEditTaskDesc(t.description || "");
    setEditTaskStage(t.stage || "CONTENT_BRIEF");
    setEditTaskPriority(t.priority || "MEDIUM");
    setEditTaskAssignee(t.assigneeName || "");
    setEditTaskDueDate(t.dueDate ? String(t.dueDate).slice(0, 10) : "");
    setEditTaskProjectId(t.projectId || t.project?.id || "");
    setEditTaskClientId(t.clientId || t.client?.id || "");
    setEditTaskModalOpen(true);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agency/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDesc || null,
          stage: newTaskStage,
          priority: newTaskPriority,
          assigneeName: newTaskAssignee || undefined,
          dueDate: newTaskDueDate || null,
          projectId: newTaskProjectId || selectedProjectId || null,
          clientId: newTaskClientId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTaskModalOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        fetchAgencyTasks();
        fetchProjects();
      } else {
        alert(data.error || "Failed to create workflow task");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateWorkflowTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          description: editTaskDesc || null,
          stage: editTaskStage,
          priority: editTaskPriority,
          assigneeName: editTaskAssignee || null,
          dueDate: editTaskDueDate || null,
          projectId: editTaskProjectId || null,
          clientId: editTaskClientId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditTaskModalOpen(false);
        setEditingTask(null);
        fetchAgencyTasks();
        fetchProjects();
      } else {
        alert(data.error || "Failed to update workflow task");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkflowTask(taskId: string, title: string) {
    if (!confirm(`Delete workflow task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/agency/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchAgencyTasks();
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team?activeOnly=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeamMembers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
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
        method: "PATCH",
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

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {agencyTasks.filter((t) => (t.projectId || t.project?.id) === p.id).length || p._count?.tasks || 0} workflow tasks
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      const el = document.getElementById("project-kanban-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      selectedProjectId === p.id
                        ? "text-emerald-700 underline"
                        : "text-emerald-600 hover:text-emerald-800"
                    }`}
                  >
                    <span>Manage Tasks →</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Kanban Board Section */}
      <div id="project-kanban-section" className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">
              Workflow Tasks Kanban Board
            </h2>
            {selectedProjectId && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
                <span>
                  Filtered: {projects.find((p) => p.id === selectedProjectId)?.name || "Selected Project"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="px-2 py-0.5 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold transition cursor-pointer"
                >
                  Clear Project Filter ×
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const proj = projects.find((p) => p.id === selectedProjectId);
              setNewTaskProjectId(selectedProjectId || "");
              setNewTaskClientId(proj?.client?.id || "");
              setTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Workflow Task</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowStages.map((st) => {
            const stageTasks = agencyTasks.filter((t) => {
              if (t.stage !== st.key) return false;
              if (selectedProjectId && (t.projectId || t.project?.id) !== selectedProjectId) return false;
              return true;
            });

            return (
              <div key={st.key} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{stageTasks.length}</span>
                </div>

                <div className="space-y-2.5">
                  {stageTasks.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-slate-400">No tasks in this stage</div>
                  ) : (
                    stageTasks.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditTaskModal(item)}
                              title="Edit Workflow Task"
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkflowTask(item.id, item.title)}
                              title="Delete Workflow Task"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="font-semibold text-emerald-700 truncate max-w-[120px]">
                            {item.project?.name || item.client?.name || "General"}
                          </span>
                          <span>{item.assigneeName || "Unassigned"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Workflow Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">New Workflow Task</h3>
              <button onClick={() => setTaskModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={newTaskStage}
                    onChange={(e) => setNewTaskStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {workflowStages.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project</label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">No Project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client</label>
                  <select
                    value={newTaskClientId}
                    onChange={(e) => setNewTaskClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">No Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    placeholder="Assignee name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setTaskModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workflow Task Modal */}
      {editTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Edit Workflow Task</h3>
              <button onClick={() => setEditTaskModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateWorkflowTask} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={editTaskStage}
                    onChange={(e) => setEditTaskStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {workflowStages.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project</label>
                  <select
                    value={editTaskProjectId}
                    onChange={(e) => setEditTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">No Project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client</label>
                  <select
                    value={editTaskClientId}
                    onChange={(e) => setEditTaskClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">No Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={editTaskAssignee}
                    onChange={(e) => setEditTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditTaskModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold">
                  Save Task Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {teamMembers.length > 0 ? (
                    <select
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName} ({m.primaryRole || "Member"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Sameer Meena, Kunal Sen"
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  )}
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
                  {teamMembers.length > 0 ? (
                    <select
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName} ({m.primaryRole || "Member"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Sameer Meena, Kunal Sen"
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  )}
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
