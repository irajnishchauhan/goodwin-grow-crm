"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Loader2,
  Trash2,
  Download,
  Search,
  X,
} from "lucide-react";

interface ProposalItem {
  id: string;
  quotationNumber: string;
  customerName?: string | null;
  company?: { name?: string | null } | null;
  contact?: { firstName?: string | null; lastName?: string | null } | null;
  deal?: { title?: string | null } | null;
  total: number;
  totalAmount?: number;
  status: string;
  validUntil?: string | null;
  notes?: string | null;
  items?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxPercent?: number;
  }>;
  createdAt: string;
}

function getProposalClientName(item: ProposalItem): string {
  return (
    item.customerName ||
    item.company?.name ||
    (item.contact
      ? `${item.contact.firstName || ""} ${item.contact.lastName || ""}`.trim()
      : null) ||
    item.deal?.title ||
    "Prospective Client"
  );
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(
    "Standard Goodwin Grow Agency Retainer Proposal. Valid for 14 days."
  );
  const [lineItems, setLineItems] = useState([
    { description: "Growth OS Retainer Package", quantity: 1, unitPrice: 30000, taxPercent: 18 },
  ]);

  // View Modal state
  const [viewingProposal, setViewingProposal] = useState<ProposalItem | null>(null);

  useEffect(() => {
    fetchProposals();
    fetchClients();
  }, []);

  async function fetchProposals() {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProposals(data.data);
      } else {
        setProposals([]);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClients(data.data);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  }

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          validUntil,
          notes,
          status: "SENT",
          items: lineItems.map((li) => ({
            description: li.description || "Agency Service",
            quantity: Number(li.quantity) || 1,
            unitPrice: Number(li.unitPrice) || 0,
            taxPercent: Number(li.taxPercent ?? 18),
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setCustomerName("");
        setLineItems([
          { description: "Growth OS Retainer Package", quantity: 1, unitPrice: 30000, taxPercent: 18 },
        ]);
        fetchProposals();
      } else {
        alert(data.error || "Failed to create proposal");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create proposal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        fetchProposals();
      } else {
        alert(data.error || "Failed to update proposal status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update proposal status");
    }
  }

  async function handleDelete(id: string, qNumber: string) {
    if (!confirm(`Are you sure you want to delete proposal ${qNumber}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchProposals();
      } else {
        alert(data.error || "Failed to delete proposal");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete proposal");
    }
  }

  function exportToCSV() {
    if (proposals.length === 0) {
      alert("No proposals to export.");
      return;
    }

    const headers = ["Proposal Number", "Customer Name", "Total Amount (INR)", "Status", "Created Date"];
    const rows = proposals.map((p) => [
      p.quotationNumber,
      `"${getProposalClientName(p).replace(/"/g, '""')}"`,
      p.totalAmount ?? p.total ?? 0,
      p.status,
      new Date(p.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `proposals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredProposals = proposals.filter((p) => {
    const clientLabel = getProposalClientName(p);
    const matchesSearch =
      p.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      clientLabel.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      p.status === statusFilter ||
      (statusFilter === "APPROVED" && (p.status === "APPROVED" || p.status === "ACCEPTED"));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Proposals & Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Sales-to-Client Handoff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build high-converting agency proposals from service catalogs, track prospect approvals, and convert won deals into active client workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal / Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals by # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "DRAFT", "SENT", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? "All Proposals" : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Proposals Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No proposals match your current filter."
              : "Create high-converting proposals or client service quotes. Once approved, they can be directly converted into client retainers."}
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Proposal</span>
            </button>
          </div>
        </div>
      ) : (
        /* Proposals Grid */
        <div className="grid grid-cols-1 gap-4">
          {filteredProposals.map((item) => {
            const val = item.totalAmount ?? item.total ?? 0;
            const clientLabel = getProposalClientName(item);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {item.quotationNumber}
                      </span>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer border focus:outline-none ${
                          item.status === "APPROVED" || item.status === "ACCEPTED" || item.status === "CONVERTED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : item.status === "SENT"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="APPROVED">Approved</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="EXPIRED">Expired</option>
                      </select>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {clientLabel}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                      {item.validUntil && (
                        <span>• Valid until: {new Date(item.validUntil).toLocaleDateString("en-IN")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Total Value</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        ₹{Number(val).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingProposal(item)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        title="View Proposal Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.quotationNumber)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Proposal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Proposal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Agency Proposal / Quotation</h3>
                <p className="text-xs text-slate-500">Generate a formal retainer or project quote</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client / Prospect Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="agency-client-names"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Select or enter client name..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <datalist id="agency-client-names">
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Proposal Line Items *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setLineItems([
                        ...lineItems,
                        { description: "", quantity: 1, unitPrice: 10000, taxPercent: 18 },
                      ])
                    }
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder="Service description"
                        value={li.description}
                        onChange={(e) => {
                          const next = [...lineItems];
                          next[idx].description = e.target.value;
                          setLineItems(next);
                        }}
                        className="col-span-6 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="number"
                        min={1}
                        required
                        placeholder="Qty"
                        value={li.quantity}
                        onChange={(e) => {
                          const next = [...lineItems];
                          next[idx].quantity = Number(e.target.value) || 1;
                          setLineItems(next);
                        }}
                        className="col-span-2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="number"
                        min={0}
                        required
                        placeholder="Rate (₹)"
                        value={li.unitPrice}
                        onChange={(e) => {
                          const next = [...lineItems];
                          next[idx].unitPrice = Number(e.target.value) || 0;
                          setLineItems(next);
                        }}
                        className="col-span-3 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          className="col-span-1 p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope Notes & Payment Terms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Proposal Details Modal */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {viewingProposal.quotationNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {getProposalClientName(viewingProposal)}
                </h3>
              </div>
              <button
                onClick={() => setViewingProposal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-slate-900">{viewingProposal.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Value (incl. GST)</span>
                <span className="font-black text-emerald-700 text-sm">
                  ₹{Number(viewingProposal.totalAmount ?? viewingProposal.total ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              {Array.isArray(viewingProposal.items) && viewingProposal.items.length > 0 && (
                <div>
                  <div className="font-bold text-slate-700 mb-2">Line Items</div>
                  <div className="space-y-1.5">
                    {viewingProposal.items.map((li, i) => (
                      <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span>
                          {li.description} × {li.quantity}
                        </span>
                        <span className="font-semibold">
                          ₹{Number(li.unitPrice * li.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingProposal.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                  {viewingProposal.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
