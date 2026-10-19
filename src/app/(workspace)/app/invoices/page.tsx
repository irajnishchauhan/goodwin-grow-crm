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

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("Monthly Social Media & Performance Retainer");
  const [subtotal, setSubtotal] = useState("50000");
  const [dueDate, setDueDate] = useState("2026-10-31");

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
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkPaid(id: string) {
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
          <span>Generate Client Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Invoiced (Q4 2026)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalBilled.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            Incl. 18% CGST + SGST
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Collected
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Verified bank settlements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending / Outstanding
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">
            Awaiting client remittance
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Client Invoices Register
          </h3>
          <div className="flex items-center gap-2">
            {["ALL", "PAID", "SENT", "OVERDUE"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

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
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-4 h-4" />
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
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
