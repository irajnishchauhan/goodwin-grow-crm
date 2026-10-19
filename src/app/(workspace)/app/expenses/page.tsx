"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  DollarSign,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  Tag,
  X,
  Edit2,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

interface AgencyExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  isBillable: boolean;
  client?: {
    id: string;
    name: string;
  } | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<AgencyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("Creative Production");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [isBillable, setIsBillable] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<AgencyExpense | null>(null);
  const [editCategory, setEditCategory] = useState("Creative Production");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editIsBillable, setEditIsBillable] = useState(false);

  useEffect(() => {
    fetchExpenses();
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

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/expenses");
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data?.expenses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agency/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          amount,
          clientId: clientId || null,
          isBillable,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setDescription("");
        setAmount("");
        fetchExpenses();
      } else {
        alert(data.error || "Failed to log expense");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(exp: AgencyExpense) {
    setEditingExpense(exp);
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditAmount(String(exp.amount));
    setEditClientId(exp.client?.id || "");
    setEditIsBillable(exp.isBillable);
    setEditModalOpen(true);
  }

  async function handleUpdateExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpense) return;
    setSaving(true);

    const numAmount = Number(editAmount);

    // Optimistic UI update
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              category: editCategory,
              description: editDescription,
              amount: numAmount,
              isBillable: editIsBillable,
            }
          : exp
      )
    );

    try {
      const res = await fetch(`/api/agency/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editCategory,
          description: editDescription,
          amount: numAmount,
          clientId: editClientId || null,
          isBillable: editIsBillable,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        alert(data.error || "Failed to update expense");
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      fetchExpenses();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(id: string, desc: string) {
    if (!confirm(`Are you sure you want to delete expense "${desc}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));

    try {
      const res = await fetch(`/api/agency/expenses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete expense");
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
      fetchExpenses();
    } finally {
      setDeletingId(null);
    }
  }

  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const billableCosts = expenses
    .filter((e) => e.isBillable)
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const overheadRatio = totalExpenses > 0 ? (((totalExpenses - billableCosts) / totalExpenses) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Operating Expenses
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Cost Accounting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log direct client delivery costs, subcontractor fees, media buying software licenses, and production shoots.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Delivery Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Operational Costs
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            Across active retainer accounts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Billable Pass-Through Costs
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            ₹{billableCosts.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
            Directly reimbursed by clients
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Agency Overhead Ratio
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {overheadRatio}%
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">
            Internal tools and software licenses
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recorded Expenditure Ledger
          </h3>
          <span className="text-xs font-semibold text-emerald-600">
            {expenses.length} Logged Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Client Allocation</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{exp.description}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {exp.client ? (
                        <span className="font-semibold text-emerald-700">{exp.client.name}</span>
                      ) : (
                        <span className="text-slate-400">Agency Overhead</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.isBillable ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {exp.isBillable ? "Billable" : "Non-Billable"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.description)}
                          disabled={deletingId === exp.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          title="Delete Expense"
                        >
                          {deletingId === exp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Delivery Expense</h3>
                <p className="text-xs text-slate-500">Record a subcontractor fee or tool cost.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Freelance 4K Videographer on-site shoot"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Creative Production">Creative Production</option>
                  <option value="Software Tools">Software Tools / MarTech</option>
                  <option value="Subcontractor">Subcontractor / Translators</option>
                  <option value="Media Spend">Media Spend / Conversions API</option>
                  <option value="Agency Overhead">Agency Overhead</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="8000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Allocation</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">General Overhead</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="billable"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="billable" className="text-xs font-medium text-slate-700">
                  Billable back to client (Pass-through cost)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Operating Expense</h3>
                <p className="text-xs text-slate-500">Update cost, category, or client allocation.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Creative Production">Creative Production</option>
                  <option value="Software Tools">Software Tools / MarTech</option>
                  <option value="Subcontractor">Subcontractor / Translators</option>
                  <option value="Media Spend">Media Spend / Conversions API</option>
                  <option value="Agency Overhead">Agency Overhead</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Allocation</label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">General Overhead</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editBillable"
                  checked={editIsBillable}
                  onChange={(e) => setEditIsBillable(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editBillable" className="text-xs font-medium text-slate-700">
                  Billable back to client (Pass-through cost)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
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
