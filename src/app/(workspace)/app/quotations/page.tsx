"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Plus, Search, Building2, Download, Trash2, X, Filter, User, Edit2, Save, CheckSquare, Square } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [creatorFilter, setCreatorFilter] = useState("ALL");

  // Line items for modal
  const [items, setItems] = useState([
    { description: "Industrial Tubular Battery (150Ah)", quantity: 5, unitPrice: 12500, discount: 0, taxRate: 18 },
  ]);
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("Net 30 days. Includes standard 36-month replacement warranty.");
  const [creating, setCreating] = useState(false);

  // Edit Quotation Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editDealId, setEditDealId] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editTerms, setEditTerms] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchEntities();
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

  async function fetchEntities() {
    try {
      const [compRes, contRes, dealRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/contacts"),
        fetch("/api/deals"),
      ]);
      const [compData, contData, dealData] = await Promise.all([
        compRes.json(),
        contRes.json(),
        dealRes.json(),
      ]);
      if (compData.success) setCompanies(compData.data || []);
      if (contData.success) setContacts(contData.data || []);
      if (dealData.success) setDeals(dealData.data || []);
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

  function addEditItem() {
    setEditItems((prev) => [
      ...prev,
      { description: "Product or Service Item", quantity: 1, unitPrice: 5000, discount: 0, taxRate: 18 },
    ]);
  }

  function removeEditItem(index: number) {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEditItem(index: number, field: string, val: any) {
    setEditItems((prev) =>
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

  let editSubtotal = 0;
  let editTotalDiscount = 0;
  let editTotalTax = 0;

  editItems.forEach((it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    const d = Number(it.discount) || 0;
    const t = Number(it.taxRate) || 0;
    const lineSub = q * p;
    const lineTax = (lineSub - d) * (t / 100);
    editSubtotal += lineSub;
    editTotalDiscount += d;
    editTotalTax += lineTax;
  });

  const editGrandTotal = editSubtotal - editTotalDiscount + editTotalTax;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          companyId: companyId || null,
          contactId: contactId || null,
          dealId: dealId || null,
          validUntil: validUntil || null,
          terms,
        }),
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

  function openEditModal(q: any) {
    setEditingQuotation(q);
    setEditCompanyId(q.companyId || "");
    setEditContactId(q.contactId || "");
    setEditDealId(q.dealId || "");
    setEditValidUntil(q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : "");
    setEditTerms(q.terms || "");
    setEditItems(
      Array.isArray(q.items) && q.items.length > 0
        ? q.items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            discount: Number(it.discount) || 0,
            taxRate: Number(it.taxRate) || 18,
          }))
        : [{ description: "Service Item", quantity: 1, unitPrice: Number(q.subtotal) || 0, discount: 0, taxRate: 18 }]
    );
    setEditModalOpen(true);
  }

  async function handleUpdateQuotation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuotation) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/quotations/${editingQuotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems,
          companyId: editCompanyId || null,
          contactId: editContactId || null,
          dealId: editDealId || null,
          validUntil: editValidUntil || null,
          terms: editTerms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingQuotation(null);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to update quotation");
      }
    } catch {
      alert("Error updating quotation");
    } finally {
      setSavingEdit(false);
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

  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isAllQuotationsSelected =
    filteredQuotations.length > 0 &&
    filteredQuotations.every((q) => selectedQuotationIds.includes(q.id));

  function handleSelectAllQuotations() {
    if (isAllQuotationsSelected) {
      setSelectedQuotationIds([]);
    } else {
      setSelectedQuotationIds(filteredQuotations.map((q) => q.id));
    }
  }

  function handleToggleQuotation(id: string) {
    setSelectedQuotationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleBulkDeleteQuotations() {
    if (selectedQuotationIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${selectedQuotationIds.length} selected quotations?`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedQuotationIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedQuotationIds([]);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to delete quotations");
      }
    } catch {
      alert("Error deleting quotations");
    } finally {
      setBulkDeleting(false);
    }
  }

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

      {/* Bulk Selection Bar */}
      {selectedQuotationIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>{selectedQuotationIds.length} of {filteredQuotations.length} quotations selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDeleteQuotations}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{bulkDeleting ? "Deleting..." : `Delete Selected (${selectedQuotationIds.length})`}</span>
            </button>
            <button
              onClick={() => setSelectedQuotationIds([])}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={handleSelectAllQuotations}
                    className="p-1 hover:text-emerald-600 transition flex items-center justify-center cursor-pointer"
                    title={isAllQuotationsSelected ? "Deselect All" : "Select All"}
                  >
                    {isAllQuotationsSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
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
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading quotations...</td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No quotations generated yet. Create your first quote above!
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className={`hover:bg-slate-50/60 transition group ${selectedQuotationIds.includes(q.id) ? "bg-emerald-50/40" : ""}`}>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleQuotation(q.id)}
                        className="p-1 hover:text-emerald-600 transition flex items-center justify-center cursor-pointer"
                      >
                        {selectedQuotationIds.includes(q.id) ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(q)}
                          title="Edit Quotation"
                          className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 cursor-pointer transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.quotationNumber)}
                          title="Delete Quotation"
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact</label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deal</label>
                  <select
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

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
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          placeholder="Item Description"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
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
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) => updateItem(idx, "discount", e.target.value)}
                          placeholder="Disc ₹"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.taxRate}
                          onChange={(e) => updateItem(idx, "taxRate", e.target.value)}
                          placeholder="GST%"
                          className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
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
                  <span>GST Taxes:</span>
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

      {/* Edit Quotation Modal */}
      {editModalOpen && editingQuotation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Quotation #{editingQuotation.quotationNumber}</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuotation} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={editCompanyId}
                    onChange={(e) => setEditCompanyId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact</label>
                  <select
                    value={editContactId}
                    onChange={(e) => setEditContactId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deal</label>
                  <select
                    value={editDealId}
                    onChange={(e) => setEditDealId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">None</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={editValidUntil}
                    onChange={(e) => setEditValidUntil(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Line Items</span>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateEditItem(idx, "description", e.target.value)}
                          placeholder="Item Description"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateEditItem(idx, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateEditItem(idx, "unitPrice", e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) => updateEditItem(idx, "discount", e.target.value)}
                          placeholder="Disc ₹"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.taxRate}
                          onChange={(e) => updateEditItem(idx, "taxRate", e.target.value)}
                          placeholder="GST%"
                          className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(editSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes:</span>
                  <span className="font-semibold">{formatCurrency(editTotalTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatCurrency(editGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
