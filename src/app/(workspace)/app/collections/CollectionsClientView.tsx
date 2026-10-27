"use client";

import React, { useState } from "react";
import {
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Search,
  Filter,
  ArrowUpRight,
  DollarSign,
  FileText,
  Calendar,
  X,
  Plus,
  Send,
  Building2,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CollectionItem {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  amountDue: any;
  amountPaid: any;
  dueDate: string | Date;
  paymentDate: string | Date | null;
  paymentMode: string | null;
  status: string;
  ageingDays: number;
  followUpNotes: string | null;
  nextFollowUpDate: string | Date | null;
  partner: {
    id: string;
    code: string;
    businessName: string;
    ownerName: string;
    phone: string;
    city: string;
    territory: string;
  };
}

interface CollectionsClientViewProps {
  initialCollections: any[];
  partners: Array<{
    id: string;
    businessName: string;
    code: string;
    city: string;
    outstandingBalance: any;
    overdueAmount: any;
  }>;
  tenantName: string;
}

export function CollectionsClientView({
  initialCollections,
  partners,
  tenantName,
}: CollectionsClientViewProps) {
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ageing Buckets Calculation
  let totalOutstanding = 0;
  let b0to30 = 0;
  let b31to60 = 0;
  let b61to90 = 0;
  let b90Plus = 0;

  for (const c of collections) {
    if (c.status !== "PAID") {
      const remaining = Number(c.amountDue) - Number(c.amountPaid);
      totalOutstanding += remaining;
      if (c.ageingDays <= 30) b0to30 += remaining;
      else if (c.ageingDays <= 60) b31to60 += remaining;
      else if (c.ageingDays <= 90) b61to90 += remaining;
      else b90Plus += remaining;
    }
  }

  const followUpQueue = collections.filter(
    (c) => c.status === "OVERDUE" && c.nextFollowUpDate !== null
  );

  const filteredCollections = collections.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.invoiceNumber.toLowerCase().includes(q) ||
        c.partner.businessName.toLowerCase().includes(q) ||
        c.partner.code.toLowerCase().includes(q) ||
        (c.followUpNotes && c.followUpNotes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollection) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/batteries/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCollection.id,
          paymentReceived: paymentAmount ? Number(paymentAmount) : 0,
          followUpNotes: followUpNote,
          nextFollowUpDate: nextFollowUpDate || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCollections((prev) =>
          prev.map((c) => (c.id === selectedCollection.id ? { ...c, ...data.data } : c))
        );
        setSelectedCollection(null);
        setPaymentAmount("");
        setFollowUpNote("");
        setNextFollowUpDate("");
        setToastMessage(`Updated ledger for invoice ${selectedCollection.invoiceNumber}!`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to update collection");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (colId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber} from collections?`)) return;
    try {
      const res = await fetch(`/api/batteries/collections/${colId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCollections((prev) => prev.filter((c) => c.id !== colId));
        setToastMessage(`Invoice ${invoiceNumber} deleted from collections.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || "Failed to delete collection");
      }
    } catch {
      alert("Error deleting collection");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl flex items-center justify-between border border-emerald-700 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md w-fit mb-1 border border-rose-200">
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
            <span>Goodwin Batteries Credit & Collections</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Receivables & Ageing Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor dealer payment ageing, record payment collections, and manage recovery follow-up schedules.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      {/* 4 Ageing Bucket KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">0 - 30 Days</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(b0to30)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Within standard credit cycle</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">31 - 60 Days</div>
          <div className="text-2xl font-black text-amber-600 mt-2">{formatCurrency(b31to60)}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Payment reminder triggered</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">61 - 90 Days</div>
          <div className="text-2xl font-black text-orange-600 mt-2">{formatCurrency(b61to90)}</div>
          <div className="text-[11px] text-orange-700 font-semibold mt-1">Hold further dispatches</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">90+ Days (Critical)</div>
          <div className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(b90Plus)}</div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">Accounts escalation required</div>
        </div>
      </div>

      {/* Dedicated 7 Collection Follow-ups Queue from prompt */}
      <div className="bg-white rounded-3xl border border-rose-200/90 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Active Collection Follow-up Queue
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                {followUpQueue.length} Overdue Cases
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dealers with overdue balances where sales representatives have logged follow-up notes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followUpQueue.map((col) => {
            const dueRemaining = Number(col.amountDue) - Number(col.amountPaid);

            return (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 hover:border-rose-300 transition space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[160px]">
                      {col.partner.businessName}
                    </span>
                    <span className="font-black text-rose-700 text-sm">
                      {formatCurrency(dueRemaining)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{col.partner.ownerName}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">{col.partner.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-slate-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {col.invoiceNumber}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200/80 text-rose-800">
                      {col.ageingDays} days overdue
                    </span>
                  </div>

                  {col.followUpNotes && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-white/90 p-2.5 rounded-xl border border-rose-100 italic">
                      &quot;{col.followUpNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Next: {col.nextFollowUpDate ? formatDate(col.nextFollowUpDate) : "Tomorrow"}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCollection(col);
                      setFollowUpNote(col.followUpNotes || "");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                  >
                    Action Note
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Receivables Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, dealer name, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {["ALL", "OVERDUE", "PENDING", "PAID"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Dealer Name</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount Due</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Ageing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollections.map((col) => {
                const bal = Number(col.amountDue) - Number(col.amountPaid);

                return (
                  <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {col.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{col.partner.businessName}</div>
                      <div className="text-[10px] text-slate-400">{col.partner.city}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(col.dueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(Number(col.amountDue))}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      {formatCurrency(Number(col.amountPaid))}
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-700">
                      {formatCurrency(bal)}
                    </td>
                    <td className="py-3.5 px-4">
                      {col.ageingDays > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                          {col.ageingDays} Days
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Current</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          col.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : col.status === "OVERDUE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {col.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {col.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setSelectedCollection(col);
                              setFollowUpNote(col.followUpNotes || "");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Update / Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCollection(col.id, col.invoiceNumber)}
                          title="Delete Invoice"
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action / Record Payment Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Collection Action & Payment</h3>
                <p className="text-xs text-slate-500">{selectedCollection.partner.businessName} • {selectedCollection.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedCollection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCollection} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Amount Due</div>
                  <div className="text-sm font-black text-slate-900">
                    {formatCurrency(Number(selectedCollection.amountDue))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Balance</div>
                  <div className="text-sm font-black text-rose-600">
                    {formatCurrency(Number(selectedCollection.amountDue) - Number(selectedCollection.amountPaid))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Record Payment Received (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 42000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Follow-up Notes / Promised Commitment</label>
                <textarea
                  rows={3}
                  placeholder="Enter notes from phone call or visit..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Schedule Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCollection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
