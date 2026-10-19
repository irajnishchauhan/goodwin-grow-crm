"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Filter,
  User,
  Edit2,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Building2,
  Sparkles,
  Layers,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const agencyStages = [
  { key: "CONTENT_BRIEF", label: "1. Content Brief", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "COPYWRITING", label: "2. Copywriting", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { key: "DESIGN", label: "3. Design & Motion", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { key: "INTERNAL_REVIEW", label: "4. Internal Review", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "CLIENT_APPROVAL", label: "5. Client Approval", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { key: "SCHEDULED", label: "6. Scheduled", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { key: "PUBLISHED", label: "7. Published", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
];

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<"AGENCY" | "CRM">("AGENCY");
  const [tasks, setTasks] = useState<any[]>([]);
  const [agencyTasks, setAgencyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState("ALL");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Standard CRM Task Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");

  // Create Agency Task Modal
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [agencyTitle, setAgencyTitle] = useState("");
  const [agencyDesc, setAgencyDesc] = useState("");
  const [agencyClientId, setAgencyClientId] = useState("");
  const [agencyStage, setAgencyStage] = useState("CONTENT_BRIEF");
  const [agencyAssignee, setAgencyAssignee] = useState("Aman Gupta");
  const [agencyRole, setAgencyRole] = useState("Content Writer");

  // Edit Agency Task Modal
  const [editAgencyModalOpen, setEditAgencyModalOpen] = useState(false);
  const [editingAgencyTask, setEditingAgencyTask] = useState<any | null>(null);
  const [editAgencyTitle, setEditAgencyTitle] = useState("");
  const [editAgencyDesc, setEditAgencyDesc] = useState("");
  const [editAgencyStage, setEditAgencyStage] = useState("CONTENT_BRIEF");
  const [editAgencyAssignee, setEditAgencyAssignee] = useState("");
  const [editAgencyRole, setEditAgencyRole] = useState("");
  const [editAgencyPriority, setEditAgencyPriority] = useState("MEDIUM");

  // Edit CRM Task Modal
  const [editCrmModalOpen, setEditCrmModalOpen] = useState(false);
  const [editingCrmTask, setEditingCrmTask] = useState<any | null>(null);
  const [editCrmTitle, setEditCrmTitle] = useState("");
  const [editCrmDesc, setEditCrmDesc] = useState("");
  const [editCrmDueDate, setEditCrmDueDate] = useState("");
  const [editCrmPriority, setEditCrmPriority] = useState("MEDIUM");
  const [editCrmStatus, setEditCrmStatus] = useState("PENDING");
  const [editCrmAssignedToId, setEditCrmAssignedToId] = useState("");

  useEffect(() => {
    fetchTeam();
    fetchClients();
  }, []);

  useEffect(() => {
    if (viewMode === "CRM") {
      fetchTasks();
    } else {
      fetchAgencyTasks();
    }
  }, [viewMode, statusFilter, assignedToFilter]);

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

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success) setClients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTasks() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (assignedToFilter !== "ALL") params.set("assignedToId", assignedToFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgencyTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/tasks");
      const data = await res.json();
      if (data.success) {
        setAgencyTasks(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveAgencyStage(taskId: string, newStage: string) {
    try {
      // Optimistic
      setAgencyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, stage: newStage } : t))
      );

      await fetch(`/api/agency/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (err) {
      console.error(err);
      fetchAgencyTasks();
    }
  }

  async function handleCreateAgencyTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: agencyTitle,
          description: agencyDesc,
          clientId: agencyClientId || null,
          stage: agencyStage,
          assigneeName: agencyAssignee,
          assigneeRole: agencyRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAgencyModalOpen(false);
        setAgencyTitle("");
        setAgencyDesc("");
        fetchAgencyTasks();
      } else {
        alert(data.error || "Failed to create deliverable");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditAgencyModal(t: any) {
    setEditingAgencyTask(t);
    setEditAgencyTitle(t.title);
    setEditAgencyDesc(t.description || "");
    setEditAgencyStage(t.stage);
    setEditAgencyAssignee(t.assigneeName || "");
    setEditAgencyRole(t.assigneeRole || "");
    setEditAgencyPriority(t.priority || "MEDIUM");
    setEditAgencyModalOpen(true);
  }

  async function handleUpdateAgencyTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAgencyTask) return;
    setSaving(true);

    // Optimistic update
    setAgencyTasks((prev) =>
      prev.map((t) =>
        t.id === editingAgencyTask.id
          ? {
              ...t,
              title: editAgencyTitle,
              description: editAgencyDesc,
              stage: editAgencyStage,
              assigneeName: editAgencyAssignee,
              assigneeRole: editAgencyRole,
              priority: editAgencyPriority,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/agency/tasks/${editingAgencyTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editAgencyTitle,
          description: editAgencyDesc,
          stage: editAgencyStage,
          assigneeName: editAgencyAssignee,
          assigneeRole: editAgencyRole,
          priority: editAgencyPriority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditAgencyModalOpen(false);
        setEditingAgencyTask(null);
        fetchAgencyTasks();
      } else {
        alert(data.error || "Failed to update deliverable");
        fetchAgencyTasks();
      }
    } catch (err) {
      console.error(err);
      fetchAgencyTasks();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAgencyTask(id: string, taskTitle: string) {
    if (!confirm(`Are you sure you want to delete deliverable "${taskTitle}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setAgencyTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/agency/tasks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete deliverable");
        fetchAgencyTasks();
      }
    } catch (err) {
      console.error(err);
      fetchAgencyTasks();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateCrmTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate || null,
          priority,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedToId("");
        fetchTasks();
      } else {
        alert(data.error || "Failed to create CRM task");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditCrmModal(t: any) {
    setEditingCrmTask(t);
    setEditCrmTitle(t.title);
    setEditCrmDesc(t.description || "");
    setEditCrmDueDate(t.dueDate ? t.dueDate.slice(0, 10) : "");
    setEditCrmPriority(t.priority || "MEDIUM");
    setEditCrmStatus(t.status || "PENDING");
    setEditCrmAssignedToId(t.assignedToId || "");
    setEditCrmModalOpen(true);
  }

  async function handleUpdateCrmTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCrmTask) return;
    setSaving(true);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingCrmTask.id
          ? {
              ...t,
              title: editCrmTitle,
              description: editCrmDesc,
              dueDate: editCrmDueDate || null,
              priority: editCrmPriority,
              status: editCrmStatus,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${editingCrmTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editCrmTitle,
          description: editCrmDesc,
          dueDate: editCrmDueDate || null,
          priority: editCrmPriority,
          status: editCrmStatus,
          assignedToId: editCrmAssignedToId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditCrmModalOpen(false);
        setEditingCrmTask(null);
        fetchTasks();
      } else {
        alert(data.error || "Failed to update task");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      fetchTasks();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCrmTask(id: string, taskTitle: string) {
    if (!confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete task");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      fetchTasks();
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleCrmStatus(task: any) {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchTasks();
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {viewMode === "AGENCY"
                ? "Agency 7-Stage Delivery Workflow"
                : "Sales & CRM Productivity Tasks"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {viewMode === "AGENCY" ? "ClickUp & monday Inspired" : "CRM Tasks"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === "AGENCY"
              ? "Content Brief → Copywriting → Design → Internal Review → Client Approval → Scheduled → Published."
              : "Track follow-up deadlines, deal activities, and individual employee work queues."}
          </p>
        </div>

        {/* View Switcher and Action Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("AGENCY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "AGENCY"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Agency 7-Stage Pods
            </button>
            <button
              onClick={() => setViewMode("CRM")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "CRM"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              CRM Sales Tasks
            </button>
          </div>

          {viewMode === "AGENCY" ? (
            <button
              onClick={() => setAgencyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Deliverable</span>
            </button>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New CRM Task</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: AGENCY 7-STAGE WORKFLOW KANBAN */}
      {viewMode === "AGENCY" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1500px]">
            {agencyStages.map((st, stageIndex) => {
              const stageTasks = agencyTasks.filter((t) => t.stage === st.key);

              return (
                <div
                  key={st.key}
                  className="w-72 shrink-0 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col max-h-[75vh]"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-slate-200 bg-white/70 rounded-t-2xl flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{st.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {stageTasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                    {stageTasks.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No active items in {st.label.slice(3)}
                      </div>
                    ) : (
                      stageTasks.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            {t.client ? (
                              <div className="text-[10px] font-bold text-emerald-700 truncate max-w-[140px]">
                                {t.client.name}
                              </div>
                            ) : (
                              <div />
                            )}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditAgencyModal(t)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-50 cursor-pointer"
                                title="Edit Deliverable"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteAgencyTask(t.id, t.title)}
                                disabled={deletingId === t.id}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                                title="Delete Deliverable"
                              >
                                {deletingId === t.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {t.title}
                          </h4>

                          {t.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-slate-700">
                              {t.assigneeName || "Assigned"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{t.commentsCount || 1}</span>
                            </span>
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="flex items-center justify-between pt-1 gap-1">
                            {stageIndex > 0 ? (
                              <button
                                onClick={() =>
                                  handleMoveAgencyStage(t.id, agencyStages[stageIndex - 1].key)
                                }
                                className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Move back"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Prev</span>
                              </button>
                            ) : (
                              <span />
                            )}

                            {stageIndex < agencyStages.length - 1 ? (
                              <button
                                onClick={() =>
                                  handleMoveAgencyStage(t.id, agencyStages[stageIndex + 1].key)
                                }
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                                title="Move forward"
                              >
                                <span>Next</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 ml-auto flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Done</span>
                              </span>
                            )}
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
      )}

      {/* VIEW MODE 2: STANDARD CRM TASKS LIST */}
      {viewMode === "CRM" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {["ALL", "PENDING", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL" ? "All Tasks" : st === "PENDING" ? "Pending" : "Completed"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-600">Employee Filter:</span>
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Team Members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No CRM tasks found.</div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition group"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCrmStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer"
                    >
                      {task.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-semibold text-slate-900 ${
                          task.status === "COMPLETED" ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                        {task.assignedTo && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            {task.assignedTo.fullName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            task.priority === "URGENT"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => openEditCrmModal(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit CRM Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCrmTask(task.id, task.title)}
                      disabled={deletingId === task.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                      title="Delete CRM Task"
                    >
                      {deletingId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Agency Task Modal (Create) */}
      {agencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Agency Deliverable</h3>
                <p className="text-xs text-slate-500">Insert task into 7-stage agency pod workflow.</p>
              </div>
              <button onClick={() => setAgencyModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgencyTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={agencyTitle}
                  onChange={(e) => setAgencyTitle(e.target.value)}
                  placeholder="e.g. Design: 5-Slide Diwali Offer Carousel"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
                <select
                  required
                  value={agencyClientId}
                  onChange={(e) => setAgencyClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Stage</label>
                  <select
                    value={agencyStage}
                    onChange={(e) => setAgencyStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {agencyStages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={agencyAssignee}
                    onChange={(e) => setAgencyAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brief & Notes</label>
                <textarea
                  rows={3}
                  value={agencyDesc}
                  onChange={(e) => setAgencyDesc(e.target.value)}
                  placeholder="Asset dimensions, headline hook, brand colors..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAgencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Deliverable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agency Task Modal (Edit) */}
      {editAgencyModalOpen && editingAgencyTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Agency Deliverable</h3>
                <p className="text-xs text-slate-500">Update stage, brief, or delivery assignee.</p>
              </div>
              <button onClick={() => setEditAgencyModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAgencyTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editAgencyTitle}
                  onChange={(e) => setEditAgencyTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Stage</label>
                  <select
                    value={editAgencyStage}
                    onChange={(e) => setEditAgencyStage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    {agencyStages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={editAgencyAssignee}
                    onChange={(e) => setEditAgencyAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brief & Notes</label>
                <textarea
                  rows={3}
                  value={editAgencyDesc}
                  onChange={(e) => setEditAgencyDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditAgencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRM Task Modal (Create) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Standard CRM Task</h3>
                <p className="text-xs text-slate-500">Record an employee follow-up task.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrmTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow up on proposal"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Team Member</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRM Task Modal (Edit) */}
      {editCrmModalOpen && editingCrmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit CRM Task</h3>
                <p className="text-xs text-slate-500">Update status, priority, or deadline.</p>
              </div>
              <button onClick={() => setEditCrmModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCrmTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editCrmTitle}
                  onChange={(e) => setEditCrmTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editCrmStatus}
                    onChange={(e) => setEditCrmStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editCrmPriority}
                    onChange={(e) => setEditCrmPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editCrmDueDate}
                  onChange={(e) => setEditCrmDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label>
                <select
                  value={editCrmAssignedToId}
                  onChange={(e) => setEditCrmAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editCrmDesc}
                  onChange={(e) => setEditCrmDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCrmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
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
