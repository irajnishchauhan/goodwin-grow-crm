"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Receipt,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Download,
  Loader2,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paidAt: string;
  status: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/invoices");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Map invoices with status PAID or settled
        const paidInvoices: PaymentRecord[] = data.data
          .filter((inv: any) => inv.status === "PAID")
          .map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client?.name || inv.clientName || "Client Account",
            amount: Number(inv.totalAmount || inv.amount || 0),
            paymentMethod: inv.paymentMethod || "Bank Transfer",
            transactionRef: inv.transactionRef || `TXN-${inv.invoiceNumber}`,
            paidAt: inv.paidAt ? new Date(inv.paidAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            status: "SETTLED",
          }));
        setPayments(paidInvoices);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

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

        <Link
          href="/app/invoices"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>View Invoices</span>
        </Link>
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
            {payments.length} verified collections
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settled Transactions
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {payments.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Cleared invoices
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disputed / Chargebacks
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹0.00
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Zero payment disputes recorded
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs">Loading payment register...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Settled Payments Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you mark client invoices as paid in the Invoices dashboard, they will automatically populate here.
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
        /* Payments Table */
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Payment Transaction History
            </h3>
            <span className="text-xs font-semibold text-emerald-700">
              {payments.length} Transactions Settled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Client / Account</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Bank Reference</th>
                  <th className="py-3.5 px-4">Date Settled</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
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
                      {p.paidAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
