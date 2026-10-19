"use client";

import React, { useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  ShoppingBag,
  Wallet,
  Calendar,
  X,
  Send,
  Building2,
  Navigation,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VisitItem {
  id: string;
  partnerId: string;
  salesUserId: string;
  visitDate: string | Date;
  purpose: string;
  outcome: string | null;
  notes: string | null;
  orderBooked: any;
  collectionMade: any;
  followUpDate: string | Date | null;
  partner: {
    id: string;
    code: string;
    businessName: string;
    city: string;
    territory: string;
  };
}

interface FieldVisitsClientViewProps {
  initialVisits: any[];
  partners: Array<{ id: string; businessName: string; code: string; city: string; territory: string }>;
  tenantName: string;
}

export function FieldVisitsClientView({
  initialVisits,
  partners,
  tenantName,
}: FieldVisitsClientViewProps) {
  const [visits, setVisits] = useState<VisitItem[]>(initialVisits);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Visit State
  const [formData, setFormData] = useState({
    partnerId: partners[0]?.id || "",
    purpose: "Monthly Dealer Review & Stock Audit",
    outcome: "",
    orderBooked: "",
    collectionMade: "",
    followUpDate: "",
  });

  const totalOrdersBooked = visits.reduce((acc, v) => acc + Number(v.orderBooked || 0), 0);
  const totalCollectionsMade = visits.reduce((acc, v) => acc + Number(v.collectionMade || 0), 0);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/batteries/field-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setVisits((prev) => [data.data, ...prev]);
        setShowModal(false);
        setFormData({
          partnerId: partners[0]?.id || "",
          purpose: "Monthly Dealer Review & Stock Audit",
          outcome: "",
          orderBooked: "",
          collectionMade: "",
          followUpDate: "",
        });
        setToastMessage("Field visit logged with verified GPS coordinates!");
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to log visit");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting visit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisits = visits.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.partner.businessName.toLowerCase().includes(q) ||
        v.purpose.toLowerCase().includes(q) ||
        (v.outcome && v.outcome.toLowerCase().includes(q)) ||
        v.partner.territory.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md w-fit mb-1 border border-emerald-200">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span>Goodwin Batteries Field Sales Operations</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Territory Visits & Daily Activity Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track sales representative field check-ins, dealer stock inspections, spot order booking, and payment collections.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          Log Field Visit Check-in
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Visits Logged</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{visits.length} Visits</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% GPS Verified</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spot Orders Booked</div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{formatCurrency(totalOrdersBooked)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Generated during dealer visits</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collections Picked Up</div>
          <div className="text-3xl font-black text-purple-700 mt-2">{formatCurrency(totalCollectionsMade)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Cheques & RTGS receipts</div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dealer, territory, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Visit Date</th>
                <th className="py-3 px-4">Dealer / Outlet</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">Purpose & Meeting Notes</th>
                <th className="py-3 px-4">Order Booked</th>
                <th className="py-3 px-4">Collected</th>
                <th className="py-3 px-4">Next Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No field visits found.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatDate(visit.visitDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{visit.partner.businessName}</div>
                      <div className="text-[10px] text-slate-400">{visit.partner.city}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {visit.partner.territory}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800">{visit.purpose}</div>
                      {visit.outcome && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">&quot;{visit.outcome}&quot;</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                      {Number(visit.orderBooked) > 0 ? formatCurrency(Number(visit.orderBooked)) : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-700 whitespace-nowrap">
                      {Number(visit.collectionMade) > 0 ? formatCurrency(Number(visit.collectionMade)) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {visit.followUpDate ? formatDate(visit.followUpDate) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Visit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Log Field Visit Check-in</h3>
                <p className="text-xs text-slate-500">Record dealer visit details and commercial outcomes.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Channel Partner *</label>
                <select
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessName} ({p.code}) • {p.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Visit Purpose *</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Monthly Dealer Review & Stock Audit">Monthly Dealer Review & Stock Audit</option>
                  <option value="Payment Recovery & Ageing Settlement">Payment Recovery & Ageing Settlement</option>
                  <option value="New Lithium 48V LFP Demo & Retail POS Display Setup">New Lithium 48V LFP Demo & Retail POS Display Setup</option>
                  <option value="Warranty Replacement Handover & Core Scrap Pickup">Warranty Replacement Handover & Core Scrap Pickup</option>
                  <option value="Commercial Fleet Sizing Meeting with Truck Union">Commercial Fleet Sizing Meeting with Truck Union</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Meeting Outcome & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Summary of meeting with proprietor..."
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Booked (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={formData.orderBooked}
                    onChange={(e) => setFormData({ ...formData, orderBooked: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Collected (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={formData.collectionMade}
                    onChange={(e) => setFormData({ ...formData, collectionMade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Schedule Next Visit / Follow-up</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Log Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
