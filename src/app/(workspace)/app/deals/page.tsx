"use client";

import { useEffect, useState } from "react";
import {
  Kanban,
  Plus,
  Building2,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Filter,
  User,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DealsPage() {
  const [pipeline, setPipeline] = useState<any | null>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [assignedOwnerFilter, setAssignedOwnerFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // New Deal Modal
  const [newDealModal, setNewDealModal] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState(250000);
  const [stageId, setStageId] = useState("");
  const [assignedOwnerId, setAssignedOwnerId] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Deal Modal
  const [editDealModal, setEditDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editValue, setEditValue] = useState(0);
  const [editStageId, setEditStageId] = useState("");
  const [editAssignedOwnerId, setEditAssignedOwnerId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    fetchPipelineAndDeals();
  }, [assignedOwnerFilter]);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members", err);
    }
  }

  async function fetchPipelineAndDeals() {
    try {
      setLoading(true);
      const dealsUrl =
        assignedOwnerFilter !== "ALL"
          ? `/api/deals?assignedOwnerId=${encodeURIComponent(assignedOwnerFilter)}`
          : "/api/deals";

      const [pipeRes, dealsRes] = await Promise.all([
        fetch("/api/pipelines"),
        fetch(dealsUrl),
      ]);

      const pipeData = await pipeRes.json();
      const dealsData = await dealsRes.json();

      if (pipeData.success && pipeData.data.length > 0) {
        const defaultPipe = pipeData.data[0];
        setPipeline(defaultPipe);
        setStages(defaultPipe.stages || []);
        if (defaultPipe.stages && defaultPipe.stages.length > 0) {
          setStageId((prev) => prev || defaultPipe.stages[0].id);
        }
      }

      if (dealsData.success) {
        setDeals(dealsData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveStage(dealId: string, targetStageId: string) {
    try {
      // Optimistic update
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stageId: targetStageId } : d))
      );

      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: targetStageId }),
      });

      if (!res.ok) {
        fetchPipelineAndDeals(); // Revert on error
      }
    } catch {
      fetchPipelineAndDeals();
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          value,
          pipelineId: pipeline?.id,
          stageId: stageId || stages[0]?.id,
          assignedOwnerId: assignedOwnerId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewDealModal(false);
        setTitle("");
        setValue(250000);
        setAssignedOwnerId("");
        fetchPipelineAndDeals();
      } else {
        alert(data.error || "Failed to create deal");
      }
    } catch {
      alert("Error creating deal");
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(deal: any) {
    setEditingDeal(deal);
    setEditTitle(deal.title);
    setEditValue(Number(deal.value));
    setEditStageId(deal.stageId);
    setEditAssignedOwnerId(deal.assignedOwnerId || "");
    setEditDealModal(true);
  }

  async function handleUpdateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeal) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/deals/${editingDeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          value: editValue,
          stageId: editStageId,
          assignedOwnerId: editAssignedOwnerId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditDealModal(false);
        setEditingDeal(null);
        fetchPipelineAndDeals();
      } else {
        alert(data.error || "Failed to update deal (RBAC check)");
      }
    } catch {
      alert("Error updating deal");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteDeal(dealId: string, dealTitle: string) {
    if (!confirm(`Are you sure you want to permanently delete "${dealTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        if (editingDeal && editingDeal.id === dealId) {
          setEditDealModal(false);
          setEditingDeal(null);
        }
        fetchPipelineAndDeals();
      } else {
        alert(data.error || "Failed to delete deal (Insufficient permissions / RBAC)");
      }
    } catch {
      alert("Error deleting deal");
    }
  }

  const totalPipelineVal = deals.reduce((acc, d) => acc + Number(d.value), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {pipeline ? pipeline.name : "Sales Pipeline"}
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              {deals.length} Active Deals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Pipeline Value: <span className="font-bold text-slate-900">{formatCurrency(totalPipelineVal)}</span>
          </p>
        </div>

        <button
          onClick={() => setNewDealModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Opportunity Deal</span>
        </button>
      </div>

      {/* Filter and Employee Assigned Work Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-700">Filter by Assigned Employee:</span>
          <select
            value={assignedOwnerFilter}
            onChange={(e) => setAssignedOwnerFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Team Members (Global)</option>
            <option value="me">👤 Assigned to Me (My Work)</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName} ({member.primaryRole})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{deals.length}</span> opportunities in active workspace
        </div>
      </div>

      {/* Visual Kanban Columns */}
      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading Kanban pipeline...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-250px)]">
          {stages.map((stage, idx) => {
            const stageDeals = deals.filter((d) => d.stageId === stage.id);
            const stageTotal = stageDeals.reduce((acc, d) => acc + Number(d.value), 0);

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col max-h-[calc(100vh-230px)] shadow-xs"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 bg-white/70 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{stage.name}</span>
                    <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                    <span>{formatCurrency(stageTotal)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{stage.winProbability}% prob</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-500 hover:shadow-md transition space-y-2.5 group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900 transition leading-snug">
                            {deal.title}
                          </h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditModal(deal)}
                              title="Edit Deal"
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal.id, deal.title)}
                              title="Delete Deal"
                              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {deal.company && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{deal.company.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="font-extrabold text-emerald-700">
                            {formatCurrency(Number(deal.value))}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md font-medium border border-slate-100 flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-slate-400" />
                            {deal.assignedOwner?.fullName || "Unassigned"}
                          </span>
                        </div>

                        {/* Stage Transition Quick Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[10px] text-slate-400">
                          {idx > 0 ? (
                            <button
                              onClick={() => handleMoveStage(deal.id, stages[idx - 1].id)}
                              className="hover:text-emerald-600 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>Back</span>
                            </button>
                          ) : (
                            <span></span>
                          )}

                          {idx < stages.length - 1 ? (
                            <button
                              onClick={() => handleMoveStage(deal.id, stages[idx + 1].id)}
                              className="hover:text-emerald-600 font-bold flex items-center gap-0.5 cursor-pointer ml-auto"
                            >
                              <span>Advance</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold">Terminal Stage</span>
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
      )}

      {/* New Deal Modal */}
      {newDealModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Pipeline Deal</h2>
              <button
                onClick={() => setNewDealModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 500-Unit Enterprise Contract"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Value (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Stage
                </label>
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.winProbability}% Win Probability)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Employee Owner
                </label>
                <select
                  value={assignedOwnerId}
                  onChange={(e) => setAssignedOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">Leave Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} ({member.primaryRole})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewDealModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {editDealModal && editingDeal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Pipeline Deal</h2>
              <button
                onClick={() => setEditDealModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Value (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Pipeline Stage
                </label>
                <select
                  value={editStageId}
                  onChange={(e) => setEditStageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.winProbability}% Win Probability)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Employee Owner
                </label>
                <select
                  value={editAssignedOwnerId}
                  onChange={(e) => setEditAssignedOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">Leave Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} ({member.primaryRole})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteDeal(editingDeal.id, editingDeal.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Deal</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDealModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
