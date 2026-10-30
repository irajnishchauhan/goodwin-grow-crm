"use client";

import { useEffect, useState } from "react";
import { Zap, Plus, CheckCircle2, AlertCircle, Clock, Play, X, ArrowRight, Trash2, Edit2, Save } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("lead.created");
  const [actionTitle, setActionTitle] = useState("Follow up with new inbound lead");
  const [actionDueInDays, setActionDueInDays] = useState(1);
  const [creating, setCreating] = useState(false);

  // Edit Rule State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editTriggerEvent, setEditTriggerEvent] = useState("lead.created");
  const [editActionTitle, setEditActionTitle] = useState("");
  const [editActionDueInDays, setEditActionDueInDays] = useState(1);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  async function fetchAutomations() {
    try {
      setLoading(true);
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.success) {
        setRules(data.data.rules || []);
        setExecutions(data.data.executions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(rule: any) {
    const updatedStatus = !rule.isActive;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: updatedStatus } : r)));

    try {
      await fetch(`/api/automations/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
    } catch {
      fetchAutomations();
    }
  }

  function openEditModal(rule: any) {
    setEditingRule(rule);
    setEditName(rule.name || "");
    setEditTriggerEvent(rule.triggerEvent || "lead.created");
    const firstAction = Array.isArray(rule.actions) && rule.actions.length > 0 ? rule.actions[0] : null;
    setEditActionTitle(firstAction?.title || "Follow up with prospect");
    setEditActionDueInDays(Number(firstAction?.dueInDays) || 1);
    setEditModalOpen(true);
  }

  async function handleUpdateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRule) return;
    setSavingEdit(true);

    try {
      const actions = [
        {
          type: "CREATE_TASK",
          title: editActionTitle,
          dueInDays: Number(editActionDueInDays) || 1,
          priority: "HIGH",
        },
      ];

      const res = await fetch(`/api/automations/${editingRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          triggerEvent: editTriggerEvent,
          actions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingRule(null);
        fetchAutomations();
      } else {
        alert(data.error || "Failed to update automation rule");
      }
    } catch {
      alert("Error updating automation rule");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteRule(ruleId: string, ruleName: string) {
    if (!confirm(`Are you sure you want to delete automation rule "${ruleName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchAutomations();
      } else {
        alert(data.error || "Failed to delete automation rule (RBAC permissions required)");
      }
    } catch {
      alert("Error deleting automation rule");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const actions = [
        {
          type: "CREATE_TASK",
          title: actionTitle,
          dueInDays: Number(actionDueInDays) || 1,
          priority: "HIGH",
        },
      ];

      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          triggerEvent,
          conditions: [],
          actions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName("");
        fetchAutomations();
      } else {
        alert(data.error || "Failed to create rule");
      }
    } catch {
      alert("Error creating rule");
    } finally {
      setCreating(false);
    }
  }

  function applyPreset(presetName: string, event: string, title: string) {
    setName(presetName);
    setTriggerEvent(event);
    setActionTitle(title);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workflow Automation Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zoho-style event triggers, condition matching, task generation, and execution telemetry.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rules List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Configured Automation Rules</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {rules.length} rules
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active automation rules. Create one to automate sales workflows!
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{rule.name}</span>
                      <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        {rule.triggerEvent}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Actions: {Array.isArray(rule.actions) ? rule.actions.length : 1} automated step
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                        rule.isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Paused"}
                    </button>
                    <button
                      onClick={() => openEditModal(rule)}
                      title="Edit Automation Rule"
                      className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 cursor-pointer transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id, rule.name)}
                      title="Delete Automation Rule"
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Execution Audit Trail */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Execution Telemetry & Logs</span>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Audit Trail
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {executions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No automated executions logged yet.</div>
            ) : (
              executions.map((exec) => (
                <div key={exec.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{exec.rule?.name || "Rule"}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                          exec.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : exec.status === "SKIPPED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {exec.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entity: {exec.entityType} ({exec.entityId.slice(0, 8)}...)
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatDateTime(exec.executedAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Rule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Create Automation Rule</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Presets:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyPreset("New Lead Follow-up", "lead.created", "Call new lead within 24 hours")}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left font-medium text-slate-800"
                >
                  ⚡ New Lead Follow-up
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("Deal Won Onboarding", "deal.won", "Initiate customer onboarding process")}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left font-medium text-slate-800"
                >
                  ⚡ Deal Won Onboarding
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Schedule Call on New Inbound Lead"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Event *</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                >
                  <option value="lead.created">lead.created (When a new lead / enquiry is captured)</option>
                  <option value="lead.qualified">lead.qualified (When lead moves to QUALIFIED)</option>
                  <option value="deal.won">deal.won (When opportunity / deal is won)</option>
                  <option value="deal.stage_changed">deal.stage_changed (When deal stage changes)</option>
                  <option value="warranty.claim_filed">warranty.claim_filed (When a warranty claim is logged)</option>
                  <option value="order.created">order.created (When a purchase order / dispatch request is created)</option>
                  <option value="payment.overdue">payment.overdue (When dealer payment crosses 30+ days overdue)</option>
                  <option value="field_visit.completed">field_visit.completed (When a sales rep completes a dealer visit)</option>
                  <option value="dealer.onboarded">dealer.onboarded (When a new dealer or distributor registers)</option>
                  <option value="task.overdue">task.overdue (When task passes deadline)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action: Generated Task Title *</label>
                <input
                  type="text"
                  required
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due In (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={actionDueInDays}
                  onChange={(e) => setActionDueInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  {creating ? "Saving..." : "Save Automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Automation Rule</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Event *</label>
                <select
                  value={editTriggerEvent}
                  onChange={(e) => setEditTriggerEvent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                >
                  <option value="lead.created">lead.created (When a new lead / enquiry is captured)</option>
                  <option value="lead.qualified">lead.qualified (When lead moves to QUALIFIED)</option>
                  <option value="deal.won">deal.won (When opportunity / deal is won)</option>
                  <option value="deal.stage_changed">deal.stage_changed (When deal stage changes)</option>
                  <option value="warranty.claim_filed">warranty.claim_filed (When a warranty claim is logged)</option>
                  <option value="order.created">order.created (When a purchase order / dispatch request is created)</option>
                  <option value="payment.overdue">payment.overdue (When dealer payment crosses 30+ days overdue)</option>
                  <option value="field_visit.completed">field_visit.completed (When a sales rep completes a dealer visit)</option>
                  <option value="dealer.onboarded">dealer.onboarded (When a new dealer or distributor registers)</option>
                  <option value="task.overdue">task.overdue (When task passes deadline)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action: Generated Task Title *</label>
                <input
                  type="text"
                  required
                  value={editActionTitle}
                  onChange={(e) => setEditActionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due In (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={editActionDueInDays}
                  onChange={(e) => setEditActionDueInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? "Saving..." : "Update Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
