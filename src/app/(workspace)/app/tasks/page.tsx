"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, Search, Calendar, Clock, CheckCircle2, Circle, AlertCircle, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  async function fetchTasks() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

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

  async function toggleStatus(task: any) {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    // Optimistic
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, priority }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchTasks();
      } else {
        alert(data.error || "Failed to create task");
      }
    } catch {
      alert("Error creating task");
    } finally {
      setCreating(false);
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            monday CRM-style productivity boards, follow-up deadlines, and sales reminders.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No tasks found. Keep up the good work!</div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";
            const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < now;

            return (
              <div
                key={task.id}
                className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition group"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(task)}
                    className="mt-0.5 text-slate-300 hover:text-emerald-600 transition cursor-pointer"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <h3
                      className={`text-xs font-bold ${
                        isCompleted ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>Assigned to: {task.assignedTo?.fullName || "Unassigned"}</span>
                      {task.contact && <span>• Contact: {task.contact.firstName} {task.contact.lastName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      task.priority === "URGENT"
                        ? "bg-rose-100 text-rose-800"
                        : task.priority === "HIGH"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {task.priority}
                  </span>

                  {task.dueDate && (
                    <div
                      className={`flex items-center gap-1 text-[11px] font-medium ${
                        isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Follow-up Task</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call client regarding contract terms"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
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
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {creating ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
