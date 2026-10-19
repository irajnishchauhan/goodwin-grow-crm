"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Plus, Search, Building2, Download, Trash2, X, Filter, User } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [creatorFilter, setCreatorFilter] = useState("ALL");

  // Line items for modal
  const [items, setItems] = useState([
    { description: "Industrial Tubular Battery (150Ah)", quantity: 5, unitPrice: 12500, discount: 0, taxRate: 18 },
  ]);
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("Net 30 days. Includes standard 36-month replacement warranty.");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchQuotations();
  }, []);

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

  async function fetchQuotations() {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.success) {
        setQuotations(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "Product or Service Item", quantity: 1, unitPrice: 5000, discount: 0, taxRate: 18 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, val: any) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: val } : it))
    );
  }

  // Calculate live preview
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach((it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    const d = Number(it.discount) || 0;
    const t = Number(it.taxRate) || 0;
    const lineSub = q * p;
    const lineTax = (lineSub - d) * (t / 100);
    subtotal += lineSub;
    totalDiscount += d;
    totalTax += lineTax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, validUntil, terms }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to create quotation");
      }
    } catch {
      alert("Error creating quotation");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateStatus(quotationId: string, status: string) {
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        fetchQuotations();
      } else {
        alert(data.error || "Failed to update quotation status (RBAC)");
      }
    } catch {
      alert("Error updating quotation status");
    }
  }

  async function handleDelete(quotationId: string, qNumber: string) {
    if (!confirm(`Are you sure you want to delete quotation #${qNumber}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchQuotations();
      } else {
        alert(data.error || "Failed to delete quotation (RBAC restriction)");
      }
    } catch {
      alert("Error deleting quotation");
    }
  }

  const filteredQuotations = quotations.filter((q) => {
    if (creatorFilter === "ALL") return true;
    return q.createdById === creatorFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Commercial Quotations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create professional price estimates, customize statutory taxes, tiered discounts, and track approval states.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Quotation</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-600">Filter by Creator:</span>
          <select
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Team Members</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.primaryRole})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredQuotations.length}</span> quotations
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Subtotal</th>
                <th className="py-3.5 px-4">Taxes (GST)</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Status & State Flow</th>
                <th className="py-3.5 px-4">Issued By</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No quotations generated yet. Create your first quote above!
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>{q.quotationNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{formatCurrency(Number(q.subtotal))}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatCurrency(Number(q.taxAmount))}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(Number(q.totalAmount))}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border focus:outline-none ${
                          q.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : q.status === "SENT"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : q.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="EXPIRED">Expired</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{q.createdBy?.fullName || "Admin"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(q.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(q.id, q.quotationNumber)}
                        title="Delete Quotation"
                        className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Create Sales Quotation</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Line Items</span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="Item Description"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes (18%):</span>
                  <span className="font-semibold">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
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
                  {creating ? "Generating..." : "Generate Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
