"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  X,
  CreditCard,
  FileText,
  Filter,
  Edit2,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

interface AgencyInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  items: any;
  paymentMethod?: string | null;
  paidAt?: string | null;
  client?: {
    id: string;
    name: string;
    brandName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<AgencyInvoice | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("Monthly Social Media & Performance Retainer");
  const [subtotal, setSubtotal] = useState("50000");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AgencyInvoice | null>(null);
  const [editSubtotal, setEditSubtotal] = useState("50000");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("SENT");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Razorpay UPI");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [statusFilter]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      if (data.success) setClients(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchInvoices() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/agency/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const subVal = Number(subtotal);
      const taxVal = subVal * 0.18;
      const totalVal = subVal + taxVal;

      const res = await fetch("/api/agency/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          subtotal: subVal,
          taxAmount: taxVal,
          totalAmount: totalVal,
          dueDate,
          items: [{ description: serviceDescription, amount: subVal }],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(inv: AgencyInvoice) {
    setEditingInvoice(inv);
    setEditSubtotal(String(inv.subtotal));
    setEditDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "");
    setEditStatus(inv.status);
    setEditPaymentMethod(inv.paymentMethod || "Razorpay UPI");
    const desc = Array.isArray(inv.items) && inv.items[0]?.description
      ? inv.items[0].description
      : "Agency Digital Marketing Services";
    setEditDescription(desc);
    setEditModalOpen(true);
  }

  async function handleUpdateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInvoice) return;
    setSaving(true);

    const subVal = Number(editSubtotal);
    const taxVal = subVal * 0.18;
    const totalVal = subVal + taxVal;

    // Optimistic UI update
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              subtotal: subVal,
              taxAmount: taxVal,
              totalAmount: totalVal,
              status: editStatus,
              dueDate: editDueDate || inv.dueDate,
              paymentMethod: editPaymentMethod,
              items: [{ description: editDescription, amount: subVal }],
            }
          : inv
      )
    );

    try {
      const res = await fetch(`/api/agency/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: subVal,
          taxAmount: taxVal,
          totalAmount: totalVal,
          status: editStatus,
          dueDate: editDueDate,
          paymentMethod: editPaymentMethod,
          items: [{ description: editDescription, amount: subVal }],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingInvoice(null);
        if (selectedInvoice?.id === editingInvoice.id) {
          setSelectedInvoice(data.data);
        }
        fetchInvoices();
      } else {
        alert(data.error || "Failed to update invoice");
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      fetchInvoices();
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(id: string) {
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "PAID", paidAt: new Date().toISOString() } : inv
      )
    );

    try {
      const res = await fetch(`/api/agency/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paymentMethod: "Razorpay UPI" }),
      });

      const data = await res.json();
      if (data.success) {
        if (selectedInvoice?.id === id) {
          setSelectedInvoice({ ...selectedInvoice, status: "PAID", paidAt: new Date().toISOString() });
        }
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      fetchInvoices();
    }
  }

  async function handleDeleteInvoice(id: string, num: string) {
    if (!confirm(`Are you sure you want to permanently delete invoice "${num}"?`)) return;

    setDeletingId(id);
    // Optimistic remove
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (selectedInvoice?.id === id) setSelectedInvoice(null);

    try {
      const res = await fetch(`/api/agency/invoices/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete invoice");
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      fetchInvoices();
    } finally {
      setDeletingId(null);
    }
  }

  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalCollected = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Invoices & Billing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              18% GST Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate branded retainer invoices, calculate GST tax compliance, track collections, and issue client receipts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Tax Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Invoiced (GST Inc.)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalBilled.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            {invoices.length} invoices issued this fiscal period
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settled & Collected
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Paid via UPI / Bank Wire / Gateway
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Receivables
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">
            Due for agency collection
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "PAID", "SENT", "OVERDUE"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === st
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {st === "ALL" ? "All Invoices" : st}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Subtotal</th>
                <th className="py-3.5 px-4">Total Amount (GST)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices recorded in this view.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900 group-hover:text-emerald-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.client?.name || "Client"}</div>
                      {inv.client?.brandName && (
                        <div className="text-[10px] text-slate-400">{inv.client.brandName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      ₹{Number(inv.subtotal).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "SENT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          disabled={deletingId === inv.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          title="Delete Invoice"
                        >
                          {deletingId === inv.id ? (
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

      {/* Invoice Printable View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700">Official Tax Invoice View</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedInvoice)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-50"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Brand and Invoice Info */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <div className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                    GOODWIN GROW <span className="text-emerald-600 font-black">AI</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                    Level 9, Cyber City Tower B<br />
                    DLF Cyber City, Gurugram, Haryana - 122002<br />
                    GSTIN: 06AABCU9603R1ZM • support@goodwingrowai.com
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 uppercase">TAX INVOICE</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}<br />
                    Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                  <span
                    className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedInvoice.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    STATUS: {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Bill To */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Billed To Client:
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {selectedInvoice.client?.name}
                </div>
                {selectedInvoice.client?.brandName && (
                  <div className="text-slate-500 font-medium">{selectedInvoice.client.brandName}</div>
                )}
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {selectedInvoice.client?.email && <span>Email: {selectedInvoice.client.email} • </span>}
                  {selectedInvoice.client?.phone && <span>Phone: {selectedInvoice.client.phone}</span>}
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {Array.isArray(selectedInvoice.items) &&
                    selectedInvoice.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(selectedInvoice.subtotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18%):</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(selectedInvoice.taxAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Invoice Value:</span>
                    <span className="text-emerald-700">
                      ₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details & Terms */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Bank Settlement Details:</div>
                <div>Account Name: Goodwin Grow AI Solutions Private Limited</div>
                <div>HDFC Bank • A/C No: 50200084920194 • IFSC: HDFC0000240</div>
                <div>UPI ID: goodwingrowai@hdfcbank</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Client Invoice</h3>
                <p className="text-xs text-slate-500">Issue an 18% GST tax invoice.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select an enrolled client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₹{Number(c.monthlyRetainer).toLocaleString("en-IN")}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal (₹)</label>
                  <input
                    type="number"
                    required
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-100 flex justify-between">
                <span>Total with 18% GST:</span>
                <span className="font-bold">
                  ₹{(Number(subtotal) * 1.18).toLocaleString("en-IN")}
                </span>
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
                  <span>Issue Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Invoice {editingInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-500">Update amounts, payment status, or due date.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800"
                >
                  <option value="SENT">SENT (Awaiting Payment)</option>
                  <option value="PAID">PAID (Settled)</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal (₹)</label>
                  <input
                    type="number"
                    required
                    value={editSubtotal}
                    onChange={(e) => setEditSubtotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Method</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Razorpay UPI">Razorpay UPI</option>
                  <option value="HDFC Bank Transfer (NEFT/RTGS)">HDFC Bank Transfer (NEFT/RTGS)</option>
                  <option value="Corporate Credit Card">Corporate Credit Card</option>
                  <option value="Cheque / Draft">Cheque / Demand Draft</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-100 flex justify-between">
                <span>Total with 18% GST:</span>
                <span className="font-bold">
                  ₹{(Number(editSubtotal) * 1.18).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
