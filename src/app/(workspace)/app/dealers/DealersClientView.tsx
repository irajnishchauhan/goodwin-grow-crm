"use client";

import React, { useState } from "react";
import {
  Building2,
  Users2,
  Share2,
  Store,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  X,
  FileText,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PartnerItem {
  id: string;
  code: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string | null;
  territory: string;
  type: string;
  tier: string;
  status: string;
  creditLimit: any;
  creditDays: number;
  outstandingBalance: any;
  overdueAmount: any;
  orders: any[];
  collections: any[];
  warrantyClaims: any[];
  fieldVisits: any[];
}

interface DealersClientViewProps {
  initialPartners: any[];
  distributors: Array<{ id: string; businessName: string; territory: string }>;
  salesUsers: Array<{ id: string; fullName: string; email: string }>;
  tenantName: string;
}

export function DealersClientView({
  initialPartners,
  distributors,
  salesUsers,
  tenantName,
}: DealersClientViewProps) {
  const [partners, setPartners] = useState<PartnerItem[]>(initialPartners);
  const [activeTab, setActiveTab] = useState<"DEALER" | "DISTRIBUTOR" | "RETAILER" | "PIPELINE">("DEALER");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState("ALL");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [selectedPartner, setSelectedPartner] = useState<PartnerItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Partner Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Delhi",
    territory: "",
    type: "DEALER",
    tier: "SILVER",
    status: "ACTIVE",
    creditLimit: "250000",
    creditDays: "30",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // New Partner Form State
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    gstin: "",
    pan: "",
    address: "",
    city: "",
    state: "Delhi",
    territory: "North - Delhi NCR",
    type: "DEALER",
    tier: "SILVER",
    creditLimit: "250000",
    creditDays: "30",
    parentDistributorId: "",
  });

  const handleOpenEdit = (p: PartnerItem) => {
    setEditingPartner(p);
    setEditFormData({
      businessName: p.businessName,
      ownerName: p.ownerName,
      phone: p.phone,
      email: p.email || "",
      address: p.address,
      city: p.city,
      state: p.state,
      territory: p.territory,
      type: p.type,
      tier: p.tier,
      status: p.status,
      creditLimit: String(p.creditLimit || "250000"),
      creditDays: String(p.creditDays || "30"),
    });
    setShowEditModal(true);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/batteries/dealers/${editingPartner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((item) => (item.id === editingPartner.id ? { ...item, ...data.data } : item))
        );
        if (selectedPartner?.id === editingPartner.id) {
          setSelectedPartner((prev) => (prev ? { ...prev, ...data.data } : null));
        }
        setShowEditModal(false);
        setEditingPartner(null);
      } else {
        alert(data.error || "Failed to update partner");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating partner");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete partner "${name}" and all associated orders/warranty records?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/batteries/dealers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => prev.filter((p) => p.id !== id));
        if (selectedPartner?.id === id) {
          setSelectedPartner(null);
        }
      } else {
        alert(data.error || "Failed to delete partner");
      }
    } catch {
      alert("Error deleting partner");
    }
  };

  // Unique territories
  const territories = Array.from(new Set(partners.map((p) => p.territory))).filter(Boolean);

  // Filtered partners
  const filteredPartners = partners.filter((p) => {
    if (activeTab === "PIPELINE") {
      if (p.status !== "ONBOARDING" && p.status !== "PROSPECT") return false;
    } else {
      if (p.type !== activeTab) return false;
    }

    if (selectedTerritory !== "ALL" && p.territory !== selectedTerritory) return false;
    if (selectedTier !== "ALL" && p.tier !== selectedTier) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.businessName.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.gstin && p.gstin.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const dealersCount = partners.filter((p) => p.type === "DEALER").length;
  const distributorsCount = partners.filter((p) => p.type === "DISTRIBUTOR").length;
  const retailersCount = partners.filter((p) => p.type === "RETAILER").length;
  const pipelineCount = partners.filter((p) => p.status === "ONBOARDING" || p.status === "PROSPECT").length;

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/batteries/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => [data.data, ...prev]);
        setShowAddModal(false);
        setFormData({
          businessName: "",
          ownerName: "",
          phone: "",
          email: "",
          gstin: "",
          pan: "",
          address: "",
          city: "",
          state: "Delhi",
          territory: "North - Delhi NCR",
          type: "DEALER",
          tier: "SILVER",
          creditLimit: "250000",
          creditDays: "30",
          parentDistributorId: "",
        });
      } else {
        alert(data.error || "Failed to create partner");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md w-fit mb-1 border border-amber-200">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Goodwin Batteries Channel Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Distribution Network & Dealer 360
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized dealer profiles, distributor territories, credit limits, and field relationship history.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          Onboard New Channel Partner
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("DEALER")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === "DEALER"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Dealers ({dealersCount})
        </button>

        <button
          onClick={() => setActiveTab("DISTRIBUTOR")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === "DISTRIBUTOR"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Regional Distributors ({distributorsCount})
        </button>

        <button
          onClick={() => setActiveTab("RETAILER")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === "RETAILER"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Retail Outlets ({retailersCount})
        </button>

        <button
          onClick={() => setActiveTab("PIPELINE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === "PIPELINE"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Dealer Onboarding Pipeline ({pipelineCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business name, owner, code, city, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Territories</option>
            {territories.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Tiers</option>
            <option value="PLATINUM">Platinum</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Partner Code</th>
                <th className="py-3 px-4">Business Name & Owner</th>
                <th className="py-3 px-4">Territory / Location</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Overdue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">360 View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No channel partners found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const creditPercent =
                    Number(partner.creditLimit) > 0
                      ? Math.round((Number(partner.outstandingBalance) / Number(partner.creditLimit)) * 100)
                      : 0;

                  return (
                    <tr
                      key={partner.id}
                      onClick={() => setSelectedPartner(partner)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {partner.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {partner.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {partner.ownerName} • {partner.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">{partner.city}, {partner.state}</div>
                        <div className="text-[10px] text-slate-400">{partner.territory}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            partner.tier === "PLATINUM"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : partner.tier === "GOLD"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {partner.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatCurrency(Number(partner.creditLimit))}
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              creditPercent > 80 ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, creditPercent)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(Number(partner.outstandingBalance))}
                      </td>
                      <td className="py-3.5 px-4">
                        {Number(partner.overdueAmount) > 0 ? (
                          <span className="font-bold text-rose-600">
                            {formatCurrency(Number(partner.overdueAmount))}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">₹0 (Clear)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            partner.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : partner.status === "ONBOARDING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {partner.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(partner);
                            }}
                            className="p-1 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-700 transition cursor-pointer"
                            title="Edit Partner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePartner(partner.id, partner.businessName);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="text-slate-400 group-hover:text-amber-600 transition-colors p-1">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dealer 360 Slide-over Drawer */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                  <span>{selectedPartner.type}</span>
                  <span>•</span>
                  <span>{selectedPartner.code}</span>
                  <span>•</span>
                  <span>{selectedPartner.tier} TIER</span>
                </div>
                <h2 className="text-xl font-black">{selectedPartner.businessName}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Proprietor: {selectedPartner.ownerName} • {selectedPartner.city}, {selectedPartner.state}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedPartner)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition text-white cursor-pointer"
                  title="Edit Partner Profile"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePartner(selectedPartner.id, selectedPartner.businessName)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Delete Partner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Financial & Credit Snapshot */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Commercial Credit Terms & Balance
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">Credit Limit</div>
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(Number(selectedPartner.creditLimit))}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{selectedPartner.creditDays} Days Term</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">Outstanding</div>
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(Number(selectedPartner.outstandingBalance))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">Overdue</div>
                    <div className="text-sm font-black text-rose-600">
                      {formatCurrency(Number(selectedPartner.overdueAmount))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Compliance Details */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tax & Verification Credentials
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">GSTIN</div>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {selectedPartner.gstin || "Unregistered"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">PAN</div>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {selectedPartner.pan || "N/A"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Full Address</div>
                    <div className="text-slate-700 text-xs mt-0.5">
                      {selectedPartner.address}, {selectedPartner.city}, {selectedPartner.state} - {selectedPartner.pincode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Purchase Orders ({selectedPartner.orders?.length || 0})
                  </div>
                </div>
                {selectedPartner.orders && selectedPartner.orders.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPartner.orders.map((o: any) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{o.orderNumber}</div>
                          <div className="text-[10px] text-slate-400">{formatDate(o.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">
                            {formatCurrency(Number(o.totalAmount))}
                          </div>
                          <div className="text-[10px] font-semibold text-amber-700">{o.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                    No orders booked yet for this partner.
                  </div>
                )}
              </div>

              {/* Overdue Collections */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pending / Overdue Invoices
                </div>
                {selectedPartner.collections && selectedPartner.collections.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPartner.collections.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.invoiceNumber}</div>
                          <div className="text-[10px] text-rose-700 font-semibold">{c.ageingDays} days overdue</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-rose-700">
                            {formatCurrency(Number(c.amountDue) - Number(c.amountPaid))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 p-3 bg-emerald-50 rounded-xl text-center font-medium">
                    No overdue receivables. Clean ledger.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Onboard Channel Partner</h3>
                <p className="text-xs text-slate-500">Register a new dealer, distributor, or retail outlet.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="DEALER">Dealer</option>
                    <option value="DISTRIBUTOR">Regional Distributor</option>
                    <option value="RETAILER">Retail Outlet</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="PLATINUM">Platinum</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Star Battery Works"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner / Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="15-digit GSTIN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Territory *</label>
                  <select
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="North - Delhi NCR">North - Delhi NCR</option>
                    <option value="North - Punjab & Haryana">North - Punjab & Haryana</option>
                    <option value="North - Rajasthan">North - Rajasthan</option>
                    <option value="West - Gujarat Central">West - Gujarat Central</option>
                    <option value="West - Maharashtra & Goa">West - Maharashtra & Goa</option>
                    <option value="South - Karnataka & Bengaluru">South - Karnataka & Bengaluru</option>
                    <option value="South - Tamil Nadu">South - Tamil Nadu</option>
                    <option value="East - West Bengal & Kolkata">East - West Bengal & Kolkata</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Days</label>
                  <input
                    type="number"
                    value={formData.creditDays}
                    onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Onboarding..." : "Onboard Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Partner Profile</h3>
                <p className="text-xs text-slate-500">Update business details, status, tier, or credit terms</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.businessName}
                    onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proprietor Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.ownerName}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ONBOARDING">ONBOARDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tier</label>
                  <select
                    value={editFormData.tier}
                    onChange={(e) => setEditFormData({ ...editFormData, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="DEALER">DEALER</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    <option value="RETAILER">RETAILER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={editFormData.creditLimit}
                    onChange={(e) => setEditFormData({ ...editFormData, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Days</label>
                  <input
                    type="number"
                    value={editFormData.creditDays}
                    onChange={(e) => setEditFormData({ ...editFormData, creditDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Territory</label>
                  <input
                    type="text"
                    value={editFormData.territory}
                    onChange={(e) => setEditFormData({ ...editFormData, territory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

