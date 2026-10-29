"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Paperclip,
  Repeat,
  AlertTriangle,
  FolderGit2,
  Check,
  ChevronDown,
  ChevronUp,
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

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface AttachmentItem {
  id: string;
  name: string;
  url: string;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const initialAssignedToId = searchParams.get("assignedToId") || "ALL";

  const [viewMode, setViewMode] = useState<"AGENCY" | "CRM">("CRM");
  const [tasks, setTasks] = useState<any[]>([]);
  const [agencyTasks, setAgencyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState(initialAssignedToId);
  const [clientFilter, setClientFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Expanded card state for checklists
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  // Create Standard CRM / Agency Task Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("Weekly");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", text: "Draft copy brief & headline options", completed: false },
    { id: "2", text: "Create high-res visuals & exports", completed: false },
    { id: "3", text: "Account manager review", completed: false },
  ]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");

  // Edit CRM Task Modal
  const [editCrmModalOpen, setEditCrmModalOpen] = useState(false);
  const [editingCrmTask, setEditingCrmTask] = useState<any | null>(null);
  const [editCrmTitle, setEditCrmTitle] = useState("");
  const [editCrmDesc, setEditCrmDesc] = useState("");
  const [editCrmDueDate, setEditCrmDueDate] = useState("");
  const [editCrmPriority, setEditCrmPriority] = useState("MEDIUM");
  const [editCrmStatus, setEditCrmStatus] = useState("PENDING");
  const [editCrmAssignedToId, setEditCrmAssignedToId] = useState("");
  const [editCrmClientId, setEditCrmClientId] = useState("");
  const [editCrmProjectId, setEditCrmProjectId] = useState("");
  const [editCrmIsRecurring, setEditCrmIsRecurring] = useState(false);
  const [editCrmRecurringInterval, setEditCrmRecurringInterval] = useState("Weekly");
  const [editCrmChecklist, setEditCrmChecklist] = useState<ChecklistItem[]>([]);
  const [editNewChecklistText, setEditNewChecklistText] = useState("");
  const [editCrmAttachments, setEditCrmAttachments] = useState<AttachmentItem[]>([]);
  const [editNewAttachmentName, setEditNewAttachmentName] = useState("");
  const [editNewAttachmentUrl, setEditNewAttachmentUrl] = useState("");


  useEffect(() => {
    const paramAssignee = searchParams.get("assignedToId");
    if (paramAssignee) {
      setAssignedToFilter(paramAssignee);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTeam();
    fetchClients();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (viewMode === "CRM") {
      fetchTasks();
    } else {
      fetchAgencyTasks();
    }
  }, [viewMode, statusFilter, priorityFilter, assignedToFilter, clientFilter]);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) setTeamMembers(data.data || []);
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
      const res = await fetch("/api/agency/projects");
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTasks() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (assignedToFilter !== "ALL") params.set("assignedToId", assignedToFilter);
      if (clientFilter !== "ALL") params.set("clientId", clientFilter);

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
          dueDate: dueDate ? new Date(dueDate) : null,
          priority,
          assignedToId: assignedToId || null,
          clientId: clientId || null,
          projectId: projectId || null,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : null,
          checklist,
          attachments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedToId("");
        setClientId("");
        setProjectId("");
        setIsRecurring(false);
        fetchTasks();
      } else {
        alert(data.error || "Failed to create task");
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
    setEditCrmDueDate(
      t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 16) : ""
    );
    setEditCrmPriority(t.priority || "MEDIUM");
    setEditCrmStatus(t.status || "PENDING");
    setEditCrmAssignedToId(t.assignedToId || "");
    setEditCrmClientId(t.clientId || "");
    setEditCrmProjectId(t.projectId || "");
    setEditCrmIsRecurring(Boolean(t.isRecurring));
    setEditCrmRecurringInterval(t.recurringInterval || "Weekly");
    setEditCrmChecklist(
      Array.isArray(t.checklist) ? t.checklist : []
    );
    setEditCrmAttachments(
      Array.isArray(t.attachments) ? t.attachments : []
    );
    setEditCrmModalOpen(true);
  }

  async function handleUpdateCrmTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCrmTask) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/tasks/${editingCrmTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editCrmTitle,
          description: editCrmDesc,
          dueDate: editCrmDueDate ? new Date(editCrmDueDate) : null,
          priority: editCrmPriority,
          status: editCrmStatus,
          assignedToId: editCrmAssignedToId || null,
          clientId: editCrmClientId || null,
          projectId: editCrmProjectId || null,
          isRecurring: editCrmIsRecurring,
          recurringInterval: editCrmIsRecurring ? editCrmRecurringInterval : null,
          checklist: editCrmChecklist,
          attachments: editCrmAttachments,
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

  async function toggleChecklistItem(taskId: string, itemIndex: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentChecklist: ChecklistItem[] = Array.isArray(task.checklist)
      ? [...task.checklist]
      : [];
    if (!currentChecklist[itemIndex]) return;

    currentChecklist[itemIndex].completed = !currentChecklist[itemIndex].completed;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, checklist: currentChecklist } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: currentChecklist }),
      });
    } catch {
      fetchTasks();
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

  async function handleDeleteCrmTask(id: string, taskTitle: string) {
    if (!confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;

    setDeletingId(id);
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

  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchClient = t.client?.name.toLowerCase().includes(q);
      const matchAssignee = t.assignedTo?.fullName.toLowerCase().includes(q);
      return matchTitle || matchClient || matchAssignee;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Task Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Goodwin OS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assignee, priority, due date, checklist, attachments, recurring tasks, overdue alerts, and client/project links.
          </p>
        </div>

        {/* Action Controls & Overdue Counter */}
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{overdueCount} Overdue Task{overdueCount > 1 ? "s" : ""}</span>
            </div>
          )}

          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("CRM")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "CRM"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Client & Project Tasks
            </button>
            <button
              onClick={() => setViewMode("AGENCY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "AGENCY"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7-Stage Creative Pods
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CRM & PROJECT TASKS WITH CHECKLIST, ATTACHMENTS, RECURRING & OVERDUE */}
      {viewMode === "CRM" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks by title, client, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0 flex-wrap">
              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Clients ({clients.length})</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Assignee Filter */}
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Assignees</option>
                <option value="me">Assigned to Me</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                <span>Loading agency tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No tasks match your filters. Create a task to assign work items to team members.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const checklistItems: ChecklistItem[] = Array.isArray(task.checklist) ? task.checklist : [];
                const completedCount = checklistItems.filter((i) => i.completed).length;
                const totalCount = checklistItems.length;
                const isExpanded = expandedChecklists[task.id] ?? false;
                const attachmentList: AttachmentItem[] = Array.isArray(task.attachments) ? task.attachments : [];

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border transition overflow-hidden shadow-xs ${
                      task.isOverdue
                        ? "border-rose-300 ring-2 ring-rose-100"
                        : task.status === "COMPLETED"
                        ? "border-slate-200 bg-slate-50/40 opacity-75"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Completion Checkbox & Title */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleCrmStatus(task)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0 cursor-pointer"
                        >
                          {task.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`text-sm font-bold text-slate-900 leading-snug truncate ${
                                task.status === "COMPLETED" ? "line-through text-slate-400" : ""
                              }`}
                            >
                              {task.title}
                            </h3>

                            {/* Overdue Alert Badge */}
                            {task.isOverdue && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>OVERDUE ALERT</span>
                              </span>
                            )}

                            {/* Recurring Task Badge */}
                            {task.isRecurring && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                                <Repeat className="w-3 h-3" />
                                <span>{task.recurringInterval || "Recurring"}</span>
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}

                          {/* Client, Project, Assignee, and Date Tags */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                            {/* Client Link */}
                            {task.client && (
                              <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Building2 className="w-3 h-3" />
                                <span>{task.client.name}</span>
                              </span>
                            )}

                            {/* Project Link */}
                            {task.project && (
                              <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                <FolderGit2 className="w-3 h-3" />
                                <span>{task.project.name}</span>
                              </span>
                            )}

                            {/* Assignee */}
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{task.assignedTo?.fullName || "Unassigned"}</span>
                            </span>

                            {/* Due Date */}
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-1 font-medium ${
                                  task.isOverdue ? "text-rose-600 font-bold" : "text-slate-600"
                                }`}
                              >
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Due: {formatDate(task.dueDate)}</span>
                              </span>
                            )}

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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

                      {/* Right: Checklist / Attachment pill & action buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        {/* Checklist Counter Toggle */}
                        {totalCount > 0 && (
                          <button
                            onClick={() =>
                              setExpandedChecklists((prev) => ({
                                ...prev,
                                [task.id]: !isExpanded,
                              }))
                            }
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {completedCount}/{totalCount} Checklist
                            </span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}

                        {/* Attachments Counter */}
                        {attachmentList.length > 0 && (
                          <div
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                            title={attachmentList.map((a) => a.name).join(", ")}
                          >
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                            <span>{attachmentList.length}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditCrmModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCrmTask(task.id, task.title)}
                            disabled={deletingId === task.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Checklist Section */}
                    {isExpanded && totalCount > 0 && (
                      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                        <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                          Task Checklist ({completedCount} of {totalCount} completed)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {checklistItems.map((item, idx) => (
                            <label
                              key={item.id || idx}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleChecklistItem(task.id, idx)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className={item.completed ? "line-through text-slate-400" : "text-slate-800 font-medium"}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Attachments Preview if any */}
                        {attachmentList.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400">Attachments:</span>
                            {attachmentList.map((att, i) => (
                              <a
                                key={att.id || i}
                                href={att.url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-indigo-700 font-medium hover:bg-indigo-50 transition"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{att.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: AGENCY 7-STAGE WORKFLOW KANBAN */}
      {viewMode === "AGENCY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agencyStages.map((stage) => {
            const stageTasks = agencyTasks.filter((t) => t.stage === stage.key);

            return (
              <div key={stage.key} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {stageTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageTasks.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-2"
                      >
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="font-semibold text-emerald-700">{item.client?.name || "Client"}</span>
                          <span>{item.assigneeName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Task Modal (Create) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Task</h3>
                <p className="text-xs text-slate-500">Configure checklists, recurring schedules, and client links.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrmTask} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Prepare festive social campaign reels"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Brief</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task context, design specifications, or notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="">No Client / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
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
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">Select Assignee</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Task Settings */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Make this a Recurring Task</span>
                  </label>
                  {isRecurring && (
                    <select
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    >
                      <option value="Daily">Every Day</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Monthly">Monthly Retainer</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Checklist Items Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Checklist Items</label>
                <div className="space-y-1.5 mb-2">
                  {checklist.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span>{item.text}</span>
                      <button
                        type="button"
                        onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add a checklist item..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newChecklistText.trim()) return;
                      setChecklist((prev) => [
                        ...prev,
                        { id: Date.now().toString(), text: newChecklistText.trim(), completed: false },
                      ]);
                      setNewChecklistText("");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Attachments Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachments (Links or Files)</label>
                <div className="space-y-1.5 mb-2">
                  {attachments.map((att, idx) => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="flex items-center gap-1 text-indigo-700 font-medium">
                        <Paperclip className="w-3 h-3" />
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="Attachment Name (e.g. Brief.pdf)"
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAttachmentName.trim()) return;
                        setAttachments((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            name: newAttachmentName.trim(),
                            url: newAttachmentUrl.trim() || "#",
                          },
                        ]);
                        setNewAttachmentName("");
                        setNewAttachmentUrl("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                    >
                      Attach
                    </button>
                  </div>
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

      {/* Standard Task Modal (Edit) */}
      {editCrmModalOpen && editingCrmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Task</h3>
                <p className="text-xs text-slate-500">Update status, checklists, attachments, or client.</p>
              </div>
              <button onClick={() => setEditCrmModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCrmTask} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editCrmTitle}
                  onChange={(e) => setEditCrmTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Client</label>
                  <select
                    value={editCrmClientId}
                    onChange={(e) => setEditCrmClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">No Client / General</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={editCrmDueDate}
                  onChange={(e) => setEditCrmDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Recurring Task Settings */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCrmIsRecurring}
                      onChange={(e) => setEditCrmIsRecurring(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Recurring Schedule</span>
                  </label>
                  {editCrmIsRecurring && (
                    <select
                      value={editCrmRecurringInterval}
                      onChange={(e) => setEditCrmRecurringInterval(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    >
                      <option value="Daily">Every Day</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Monthly">Monthly Retainer</option>
                    </select>
                  )}
                </div>
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
