"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  ShoppingBag,
  Receipt,
  ShieldAlert,
  BatteryCharging,
  CheckCircle2,
  Lock,
  Download,
  ExternalLink,
  ChevronRight,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PartnerPortalViewProps {
  partners: any[];
  products: any[];
  tenantName: string;
  currentUser: {
    fullName: string;
    email: string;
  };
}

export function PartnerPortalView({
  partners,
  products,
  tenantName,
  currentUser,
}: PartnerPortalViewProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"ORDERS" | "LEDGER" | "WARRANTY" | "PRICEBOOK">("ORDERS");

  const currentPartner = partners.find((p) => p.id === selectedPartnerId) || partners[0];

  if (!currentPartner) {
    return (
      <div className="p-8 text-center text-slate-500">
        No channel partners available to preview in partner portal.
      </div>
    );
  }

  const creditLimit = Number(currentPartner.creditLimit || 0);
  const outstanding = Number(currentPartner.outstandingBalance || 0);
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const creditUsagePercent = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Security Isolation Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Dealer & Distributor Partner Portal Mode
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Strict Partner Isolation
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Partner accounts can access <strong>only</strong> their assigned purchase orders, permitted credit balances, warranty claim status, and authorized price book. All internal employee pipelines, other territories, and competitor accounts are cryptographically restricted.
              </p>
            </div>
          </div>

          {/* Switch Partner Preview Selector */}
          <div className="shrink-0 bg-white/10 p-2.5 rounded-2xl border border-white/10">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
              Simulate Partner Account:
            </label>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {partners.slice(0, 15).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.businessName} ({p.code}) • {p.type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Partner Brand Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              {currentPartner.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{currentPartner.businessName}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {currentPartner.tier} PARTNER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {currentPartner.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authorized Dealer • {currentPartner.city}, {currentPartner.state} • GSTIN: {currentPartner.gstin || "Unregistered"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Available Credit</div>
              <div className="text-base font-black text-emerald-700">{formatCurrency(availableCredit)}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Outstanding</div>
              <div className="text-base font-black text-slate-900">{formatCurrency(outstanding)}</div>
            </div>
          </div>
        </div>

        {/* Credit Limit Progress */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Credit Limit: {formatCurrency(creditLimit)}</span>
            <span>{creditUsagePercent}% utilized</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                creditUsagePercent > 80 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, creditUsagePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("ORDERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "ORDERS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          My Orders ({currentPartner.orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "LEDGER"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          My Invoices & Ledger ({currentPartner.collections?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("WARRANTY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "WARRANTY"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Warranty Cases ({currentPartner.warrantyClaims?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("PRICEBOOK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "PRICEBOOK"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <BatteryCharging className="w-3.5 h-3.5" />
          Authorized Catalog & Price Book
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "ORDERS" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            My Purchase Orders History
          </h2>

          {currentPartner.orders && currentPartner.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total Value</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">ERP Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPartner.orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50/80">
                      <td className="py-3 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                      <td className="py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="py-3 text-slate-600">
                        {Array.isArray(order.items)
                          ? `${order.items.length} product lines`
                          : "Standard battery lot"}
                      </td>
                      <td className="py-3 font-black text-slate-900">{formatCurrency(Number(order.totalAmount))}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-500">
                        {order.erpOrderRef || "Pending ERP Confirmation"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No orders booked for this account yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "LEDGER" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            Account Invoices & Statement of Account
          </h2>

          {currentPartner.collections && currentPartner.collections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Invoice #</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3">Amount Due</th>
                    <th className="pb-3">Paid</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPartner.collections.map((col: any) => {
                    const bal = Number(col.amountDue) - Number(col.amountPaid);
                    return (
                      <tr key={col.id} className="hover:bg-slate-50/80">
                        <td className="py-3 font-mono font-bold text-slate-900">{col.invoiceNumber}</td>
                        <td className="py-3 text-slate-500">{formatDate(col.dueDate)}</td>
                        <td className="py-3 font-bold text-slate-900">{formatCurrency(Number(col.amountDue))}</td>
                        <td className="py-3 text-emerald-700 font-semibold">{formatCurrency(Number(col.amountPaid))}</td>
                        <td className="py-3 font-black text-rose-700">{formatCurrency(bal)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              col.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {col.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No invoices found. Account balance is clear.
            </div>
          )}
        </div>
      )}

      {activeTab === "WARRANTY" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
            Customer Warranty Claims & RMA Status
          </h2>

          {currentPartner.warrantyClaims && currentPartner.warrantyClaims.length > 0 ? (
            <div className="space-y-3">
              {currentPartner.warrantyClaims.map((claim: any) => (
                <div key={claim.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{claim.claimNumber}</span>
                      <span className="font-mono text-amber-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                        {claim.batterySerialNumber}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-700 mt-1">{claim.batteryModel}</div>
                    <div className="text-slate-500 text-[11px]">Customer: {claim.customerName} ({claim.customerPhone})</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {claim.status}
                    </span>
                    {claim.replacementSerial && (
                      <div className="font-mono text-[11px] font-bold text-emerald-700 mt-1">
                        Replacement: {claim.replacementSerial}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No warranty claims registered for this dealer.
            </div>
          )}
        </div>
      )}

      {activeTab === "PRICEBOOK" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Goodwin Batteries Authorized Dealer Price Book & Warranty Master
            </h2>
            <button className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download Official PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.sku}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-900">{p.name}</div>
                    <div className="font-mono text-[10px] text-amber-700 font-bold">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      {formatCurrency(Number(p.unitPrice))}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">+ GST & Scrap Buyback</div>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
