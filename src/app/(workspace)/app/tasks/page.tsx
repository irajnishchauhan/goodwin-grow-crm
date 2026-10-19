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

  // Create Standard CRM Task Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");
  const [creating, setCreating] = useState(false);

  // Create Agency Task Modal
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [agencyTitle, setAgencyTitle] = useState("");
  const [agencyDesc, setAgencyDesc] = useState("");
  const [agencyClientId, setAgencyClientId] = useState("");
  const [agencyStage, setAgencyStage] = useState("CONTENT_BRIEF");
  const [agencyAssignee, setAgencyAssignee] = useState("Aman Gupta");
  const [agencyRole, setAgencyRole] = useState("Content Writer");

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editAssignedToId, setEditAssignedToId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateCrmTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function toggleCrmStatus(task: any) {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
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

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("AGENCY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "AGENCY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7-Stage Agency Pod
            </button>
            <button
              onClick={() => setViewMode("CRM")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "CRM"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard CRM Tasks
            </button>
          </div>

          <button
            onClick={() => (viewMode === "AGENCY" ? setAgencyModalOpen(true) : setModalOpen(true))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{viewMode === "AGENCY" ? "New Deliverable Task" : "Add CRM Task"}</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: AGENCY 7-STAGE KANBAN */}
      {viewMode === "AGENCY" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1400px]">
            {agencyStages.map((stageObj, stageIndex) => {
              const stageTasks = agencyTasks.filter((t) => t.stage === stageObj.key);

              return (
                <div
                  key={stageObj.key}
                  className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[78vh]"
                >
                  <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${stageObj.color}`}>
                      {stageObj.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                      {stageTasks.length}
                    </span>
                  </div>

                  <div className="overflow-y-auto space-y-3 pt-3 flex-1 scrollbar-thin">
                    {stageTasks.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-slate-400">
                        No tasks in this stage
                      </div>
                    ) : (
                      stageTasks.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-xs hover:border-emerald-300 hover:shadow-sm transition space-y-2.5"
                        >
                          {t.client && (
                            <div className="text-[10px] font-bold text-emerald-700 truncate">
                              {t.client.name}
                            </div>
                          )}

                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {t.title}
                          </h4>

                          {t.assetPreview && (
                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                              <img src={t.assetPreview} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

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
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Agency Task Modal */}
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Add Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRM Task Modal */}
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
