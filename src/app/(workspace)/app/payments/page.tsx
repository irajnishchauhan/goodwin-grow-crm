"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Download,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paidAt: string;
  dueDate: string;
  status: string; // PAID | SENT | OVERDUE | DRAFT
}

export default function PaymentsPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer / NEFT");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/invoices");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: PaymentRecord[] = data.data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name || inv.clientName || "Client Account",
          amount: Number(inv.totalAmount ?? inv.amount ?? 0),
          paymentMethod: inv.paymentMethod || "Bank Transfer / NEFT",
          transactionRef: inv.transactionRef || `TXN-${inv.invoiceNumber}`,
          paidAt: inv.paidAt ? new Date(inv.paidAt).toISOString().split("T")[0] : "-",
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "-",
          status: inv.status || "SENT",
        }));
        setRecords(mapped);
        const unpaid = mapped.find((r) => r.status !== "PAID");
        if (unpaid) setSelectedInvoiceId(unpaid.id);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(invoiceId: string, method: string = "Bank Transfer / NEFT") {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/agency/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRecordModalOpen(false);
        fetchPayments();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCSV() {
    if (filteredRecords.length === 0) return;
    const headers = ["Invoice Number", "Client", "Amount (INR)", "Payment Method", "Reference", "Due Date", "Settled Date", "Status"];
    const rows = filteredRecords.map((r) => [
      `"${r.invoiceNumber}"`,
      `"${r.clientName.replace(/"/g, '""')}"`,
      r.amount,
      `"${r.paymentMethod}"`,
      `"${r.transactionRef}"`,
      r.dueDate,
      r.paidAt,
      r.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Goodwin_Payments_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const paidRecords = records.filter((r) => r.status === "PAID");
  const pendingRecords = records.filter((r) => r.status === "SENT" || r.status === "DRAFT");
  const overdueRecords = records.filter((r) => r.status === "OVERDUE");

  const totalCollected = paidRecords.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = pendingRecords.reduce((acc, p) => acc + p.amount, 0);
  const totalOverdue = overdueRecords.reduce((acc, p) => acc + p.amount, 0);

  const filteredRecords = records.filter((r) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && r.status === "PAID") ||
      (statusFilter === "PENDING" && (r.status === "SENT" || r.status === "DRAFT")) ||
      (statusFilter === "OVERDUE" && r.status === "OVERDUE");
    const matchesSearch =
      !search.trim() ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.paymentMethod.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unpaidInvoices = records.filter((r) => r.status !== "PAID");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payments & Collections Register
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Bank Settlements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile client payment receipts, gateway payouts, UPI handles, and verified bank credits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          <Link
            href="/app/invoices"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>View Invoices</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Settled Collections
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {paidRecords.length} verified collections
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending / Awaiting Settlement
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {pendingRecords.length} open invoices
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overdue Receivables
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ₹{totalOverdue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            {overdueRecords.length} overdue invoices
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, invoice #, or payment method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: "ALL", label: "All Invoices" },
            { id: "PAID", label: "Paid / Settled" },
            { id: "PENDING", label: "Pending" },
            { id: "OVERDUE", label: "Overdue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading payment register...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Payment Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create or mark client invoices as paid to reconcile collections here.
          </p>
          <div className="mt-4">
            <Link
              href="/app/invoices"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2"
            >
              <span>Manage Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Payment & Receivables Ledger
            </h3>
            <span className="text-xs font-semibold text-emerald-700">
              {filteredRecords.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Client / Account</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Due / Paid Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {p.clientName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.transactionRef}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.status === "PAID" ? p.paidAt : p.dueDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status === "PAID" ? "SETTLED" : p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {p.status !== "PAID" ? (
                        <button
                          onClick={() => handleMarkPaid(p.id, p.paymentMethod)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Manual Payment</h3>
                <p className="text-xs text-slate-500">Settle an open client invoice</p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedInvoiceId) return;
                handleMarkPaid(selectedInvoiceId, paymentMethod);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Open Invoice *</label>
                {unpaidInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    All existing invoices are already marked as PAID.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.clientName} (₹{inv.amount.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI / Corporate QR">UPI / Corporate QR</option>
                  <option value="Razorpay Gateway">Razorpay Payment Gateway</option>
                  <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || unpaidInvoices.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Recording..." : "Mark as Paid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
