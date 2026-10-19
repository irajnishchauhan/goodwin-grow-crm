"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ShoppingBag,
  Wallet,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  BatteryCharging,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Zap,
  Cpu,
  Layers,
  Search,
  Sparkles,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BatteriesDashboardProps {
  user: {
    fullName: string;
    email: string;
  };
  metrics: {
    activeDealers: number;
    openEnquiries: number;
    pendingOrders: number;
    collectionFollowUps: number;
    totalDealers: number;
    distributorsCount: number;
    retailersCount: number;
    pendingOrdersValue: number;
    totalOutstanding: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: any;
    status: string;
    erpSyncStatus: string;
    erpOrderRef: string | null;
    items: any;
    createdAt: string | Date;
    partner: {
      businessName: string;
      city: string;
      tier: string;
      territory: string;
    };
  }>;
  collections: Array<{
    id: string;
    invoiceNumber: string;
    amountDue: any;
    amountPaid: any;
    ageingDays: number;
    status: string;
    followUpNotes: string | null;
    nextFollowUpDate: string | Date | null;
    partner: {
      businessName: string;
      phone: string;
      city: string;
    };
  }>;
  fieldVisits: Array<{
    id: string;
    purpose: string;
    outcome: string | null;
    orderBooked: any;
    collectionMade: any;
    visitDate: string | Date;
    partner: {
      businessName: string;
      city: string;
      territory: string;
    };
  }>;
  warrantyCases: Array<{
    id: string;
    claimNumber: string;
    batterySerialNumber: string;
    batteryModel: string;
    status: string;
    claimType: string;
    customerName: string;
    createdAt: string | Date;
    partner?: {
      businessName: string;
    } | null;
  }>;
}

export function BatteriesDashboardView({
  user,
  metrics,
  recentOrders: initialOrders,
  collections,
  fieldVisits,
  warrantyCases,
}: BatteriesDashboardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // 1-Click Approve & Push to ERP
  const handleApproveOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await fetch("/api/batteries/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: "APPROVED",
          triggerErpSync: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "APPROVED", erpSyncStatus: "ERP_CONFIRMED_SYNCED", erpOrderRef: data.data.erpOrderRef } : o))
        );
        setActionMessage(`Order approved & synchronized with Goodwin Batteries ERP! ERP Ref: ${data.data.erpOrderRef}`);
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {actionMessage && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl flex items-center justify-between border border-emerald-700 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-300 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full w-fit mb-1.5 border border-amber-200/80">
            <BatteryCharging className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Goodwin Batteries • Sales & Distribution Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Sales & Distribution Dashboard
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200">
              FY 2026-27
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user.fullName}</span>. Real-time dealer performance, pending purchase bookings, receivables ageing, and field visit sync.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shadow-amber-600/20"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Book Dealer Order
          </Link>
          <Link
            href="/app/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            New Enquiry
          </Link>
          <Link
            href="/app/field-visits"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Log Visit
          </Link>
          <Link
            href="/app/warranty"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Warranty Desk
          </Link>
        </div>
      </div>

      {/* Exactly 4 Primary KPI Cards from prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Dealers */}
        <Link
          href="/app/dealers?tab=dealers"
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Dealers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-amber-600 transition-colors">
            {metrics.activeDealers}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              100% Channel Active
            </span>
            <span className="text-slate-400 font-medium">8 Territories</span>
          </div>
        </Link>

        {/* 2. Open Enquiries */}
        <Link
          href="/app/leads"
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Enquiries</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-blue-600 transition-colors">
            {metrics.openEnquiries}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-blue-600 font-semibold">Web, WhatsApp & Field</span>
            <span className="text-slate-400 font-medium">Auto-Routed</span>
          </div>
        </Link>

        {/* 3. Pending Orders */}
        <Link
          href="/app/orders?status=PENDING_APPROVAL"
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-amber-600 transition-colors">
            {metrics.pendingOrders}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-amber-700 font-semibold">Awaiting Credit / ERP</span>
            <span className="text-slate-500 font-medium">{formatCurrency(metrics.pendingOrdersValue)}</span>
          </div>
        </Link>

        {/* 4. Collection Follow-ups */}
        <Link
          href="/app/collections"
          className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-rose-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Follow-ups</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2 tracking-tight group-hover:text-rose-700 transition-colors">
            {metrics.collectionFollowUps}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-rose-600 font-semibold">30-70 Days Overdue</span>
            <span className="text-slate-400 font-medium">Action Scheduled</span>
          </div>
        </Link>
      </div>

      <div className="text-[11px] text-slate-400 italic text-right -mt-3 pr-1">
        Illustrative figures, not actual Goodwin Batteries data.
      </div>

      {/* ERP Boundary Sentinel Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 border border-slate-700/60 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  ERP Boundary Integration Sentinel
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  System of Record Synced
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                <strong className="text-white">CRM manages:</strong> Dealer network profiles, field sales check-ins, sales pipeline, purchase order bookings, collection follow-up reminders, and warranty complaints.
                <br />
                <strong className="text-amber-300">Goodwin Batteries ERP manages:</strong> Stock valuation, production BOM, manufacturing batch tracking, inventory accounting, GST e-Way bills, and financial general ledgers.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <Link
              href="/app/integrations"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
            >
              <span>Inspect ERP Endpoints</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Pending Orders Table with 1-Click Approve */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Dealer Orders Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  Dealer Purchase Orders Awaiting Approval
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    {orders.filter((o) => o.status === "PENDING_APPROVAL").length} Pending
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize dealer orders to generate sales orders in Goodwin Batteries ERP.
                </p>
              </div>
              <Link
                href="/app/orders"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                View All Orders
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Dealer</th>
                    <th className="pb-3">Territory</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">ERP Sync</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 6).map((order) => {
                    const isPending = order.status === "PENDING_APPROVAL";
                    const isSyncing = syncingOrderId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 font-bold text-slate-900">
                          {order.orderNumber}
                          <div className="text-[10px] font-normal text-slate-400">
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                            {order.partner?.businessName || "Unknown Dealer"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {order.partner?.city} • {order.partner?.tier}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 truncate max-w-[120px]">
                          {order.partner?.territory}
                        </td>
                        <td className="py-3 font-bold text-slate-900">
                          {formatCurrency(Number(order.totalAmount))}
                        </td>
                        <td className="py-3">
                          {order.erpSyncStatus === "ERP_CONFIRMED_SYNCED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {order.erpOrderRef || "Synced"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              ERP Queued
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition disabled:opacity-50"
                            >
                              {isSyncing ? "Syncing..." : "Approve & Push"}
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Field Sales Visits & GPS Check-ins */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Field Sales Activity & Territory Check-ins
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  GPS-verified dealer visits, order bookings, and collection pick-ups.
                </p>
              </div>
              <Link
                href="/app/field-visits"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View Visit Log
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {fieldVisits.slice(0, 4).map((visit) => (
                <div
                  key={visit.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{visit.partner?.businessName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {visit.partner?.city}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDate(visit.visitDate)}
                      </span>
                    </div>
                    <div className="text-slate-600 font-medium">{visit.purpose}</div>
                    {visit.outcome && (
                      <div className="text-[11px] text-slate-500 italic">
                        &quot;{visit.outcome}&quot;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    {Number(visit.orderBooked || 0) > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Order Booked</div>
                        <div className="font-black text-emerald-700">{formatCurrency(Number(visit.orderBooked))}</div>
                      </div>
                    )}
                    {Number(visit.collectionMade || 0) > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Collected</div>
                        <div className="font-black text-purple-700">{formatCurrency(Number(visit.collectionMade))}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Overdue Collections & Warranty Cases */}
        <div className="space-y-6">
          {/* Overdue Collection Follow-ups (7 items from prompt) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-rose-600" />
                  Collection Follow-ups
                  <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                    {collections.length} Overdue
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receivables exceeding payment terms.
                </p>
              </div>
              <Link
                href="/app/collections"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                All Ageing
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {collections.slice(0, 5).map((col) => (
                <div
                  key={col.id}
                  className="p-3 rounded-2xl border border-rose-100/80 bg-rose-50/30 hover:bg-rose-50/60 transition space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">
                      {col.partner?.businessName}
                    </span>
                    <span className="font-black text-rose-700">
                      {formatCurrency(Number(col.amountDue) - Number(col.amountPaid))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{col.invoiceNumber}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200/80 text-rose-800">
                      {col.ageingDays} days overdue
                    </span>
                  </div>

                  {col.followUpNotes && (
                    <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100 italic">
                      &quot;{col.followUpNotes}&quot;
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-400 font-medium">
                      Next Follow-up: {col.nextFollowUpDate ? formatDate(col.nextFollowUpDate) : "Tomorrow"}
                    </span>
                    <Link
                      href={`/app/collections?partnerId=${col.partner?.businessName}`}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Log Note &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warranty Desk Cases */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Warranty & Service Cases
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hydrometer tests & replacement claims.
                </p>
              </div>
              <Link
                href="/app/warranty"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Warranty Desk
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {warrantyCases.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{claim.claimNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        claim.status.includes("APPROVED")
                          ? "bg-emerald-100 text-emerald-800"
                          : claim.status === "INSPECTION"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {claim.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-700 text-[11px] truncate">
                    {claim.batteryModel}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">{claim.batterySerialNumber}</span>
                    <span>{claim.customerName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
