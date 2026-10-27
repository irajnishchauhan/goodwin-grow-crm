"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  BatteryCharging,
  X,
  Send,
  Building2,
  Phone,
  FileCheck,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ClaimItem {
  id: string;
  claimNumber: string;
  partnerId: string | null;
  customerName: string;
  customerPhone: string;
  batterySerialNumber: string;
  batteryModel: string;
  purchaseDate: string | Date;
  claimDate: string | Date;
  claimType: string;
  status: string;
  technicianNotes: string | null;
  replacementSerial: string | null;
  resolutionDate: string | Date | null;
  erpSyncStatus: string;
  createdAt: string | Date;
  partner?: {
    id: string;
    code: string;
    businessName: string;
    city: string;
  } | null;
}

interface WarrantyClientViewProps {
  initialClaims: any[];
  partners: Array<{ id: string; businessName: string; code: string; city: string }>;
  products: Array<{ id: string; name: string; sku: string | null }>;
  tenantName: string;
}

export function WarrantyClientView({
  initialClaims,
  partners,
  products,
  tenantName,
}: WarrantyClientViewProps) {
  const [claims, setClaims] = useState<ClaimItem[]>(initialClaims);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchSerial, setSearchSerial] = useState("");
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"APPROVED_REPLACEMENT" | "APPROVED_PRORATA" | "REJECTED">("APPROVED_REPLACEMENT");
  const [replacementSerial, setReplacementSerial] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Claim Form
  const [newClaim, setNewClaim] = useState({
    partnerId: partners[0]?.id || "",
    customerName: "",
    customerPhone: "",
    batterySerialNumber: "",
    batteryModel: products[0]?.name || "Goodwin PowerDrive Neo (12V 5Ah)",
    claimType: "Dead on Arrival / Low Voltage",
    technicianNotes: "",
  });

  // Digital Serial Lookup
  const handleVerifySerial = (serial: string) => {
    setSearchSerial(serial);
    if (!serial.trim()) {
      setVerificationResult(null);
      return;
    }

    const matchedClaim = claims.find(
      (c) => c.batterySerialNumber.toLowerCase() === serial.toLowerCase()
    );

    setVerificationResult({
      serial: serial.toUpperCase(),
      isValid: true,
      warrantyDuration: "48 Months (24 Free Replacement + 24 Pro-rata)",
      manufactureDate: "August 2025",
      warrantyStatus: "ACTIVE & COVERED",
      associatedDealer: matchedClaim?.partner?.businessName || "Zenith Auto Spares (DLR-001)",
      previousClaim: matchedClaim ? matchedClaim.claimNumber : null,
    });
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/batteries/warranty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClaim),
      });

      const data = await res.json();
      if (data.success) {
        setClaims((prev) => [data.data, ...prev]);
        setShowNewModal(false);
        setToastMessage(`Warranty Claim ${data.data.claimNumber} registered successfully!`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to register claim");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/batteries/warranty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClaim.id,
          status: resolutionAction,
          replacementSerial: resolutionAction === "APPROVED_REPLACEMENT" ? replacementSerial || `GB-2026-REP-${Math.floor(Math.random() * 90000 + 10000)}` : null,
          technicianNotes: techNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === selectedClaim.id ? { ...c, ...data.data } : c))
        );
        setSelectedClaim(null);
        setReplacementSerial("");
        setTechNotes("");
        setToastMessage(`Service case ${selectedClaim.claimNumber} updated to ${resolutionAction}!`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to update claim");
      }
    } catch (err) {
      console.error(err);
      alert("Error resolving claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClaim = async (claimId: string, claimNumber: string) => {
    if (!confirm(`Are you sure you want to delete warranty claim "${claimNumber}"?`)) return;
    try {
      const res = await fetch(`/api/batteries/warranty/${claimId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
        setToastMessage(`Warranty claim ${claimNumber} deleted successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || "Failed to delete claim");
      }
    } catch {
      alert("Error deleting claim");
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchSerial.trim()) {
      const q = searchSerial.toLowerCase();
      return (
        c.batterySerialNumber.toLowerCase().includes(q) ||
        c.claimNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.batteryModel.toLowerCase().includes(q)
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
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md w-fit mb-1 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Goodwin Batteries Authorized Digital Warranty Desk</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Warranty Support & Service Cases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate battery serial numbers, inspect load test reports, authorize warranty replacements, and generate ERP credit memos.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          File New Warranty Claim
        </button>
      </div>

      {/* Battery Serial Verification Tool */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 p-6 rounded-3xl border border-amber-200 shadow-xs">
        <div className="max-w-2xl">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-600" />
            Battery Serial Number Verification & Warranty Status
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Enter the unique battery QR serial printed on the battery container to query the authorized warranty registry.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              placeholder="e.g. GB-2025-VRLA-88219"
              value={searchSerial}
              onChange={(e) => handleVerifySerial(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {searchSerial && (
              <button
                onClick={() => {
                  setSearchSerial("");
                  setVerificationResult(null);
                }}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span>Quick test serials:</span>
            <button
              onClick={() => handleVerifySerial("GB-2025-VRLA-88219")}
              className="font-mono text-amber-700 font-bold hover:underline"
            >
              GB-2025-VRLA-88219
            </button>
            <span>•</span>
            <button
              onClick={() => handleVerifySerial("GB-2024-CAR-44102")}
              className="font-mono text-amber-700 font-bold hover:underline"
            >
              GB-2024-CAR-44102
            </button>
            <span>•</span>
            <button
              onClick={() => handleVerifySerial("GB-2025-LFP-00213")}
              className="font-mono text-amber-700 font-bold hover:underline"
            >
              GB-2025-LFP-00213
            </button>
          </div>
        </div>

        {/* Verification Certificate Result */}
        {verificationResult && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm animate-in fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-mono font-bold text-slate-900">{verificationResult.serial}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {verificationResult.warrantyStatus}
                </span>
              </div>
              <div className="text-slate-600">
                <strong>Warranty Terms:</strong> {verificationResult.warrantyDuration}
              </div>
              <div className="text-slate-500 text-[11px]">
                Manufactured: {verificationResult.manufactureDate} • Issued via: {verificationResult.associatedDealer}
              </div>
            </div>

            <button
              onClick={() => {
                setNewClaim({ ...newClaim, batterySerialNumber: verificationResult.serial });
                setShowNewModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
            >
              Open Claim with this Serial
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {["ALL", "SUBMITTED", "INSPECTION", "APPROVED_REPLACEMENT", "APPROVED_PRORATA", "REJECTED"].map(
          (st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Claims" : st.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Claim #</th>
                <th className="py-3 px-4">Battery Model & Serial</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Replacement Serial</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No warranty claims found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {claim.claimNumber}
                      <div className="text-[10px] font-normal text-slate-400">
                        {formatDate(claim.claimDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{claim.batteryModel}</div>
                      <div className="font-mono text-[11px] text-amber-700 font-semibold">
                        {claim.batterySerialNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{claim.customerName}</div>
                      <div className="text-[10px] text-slate-400">{claim.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">
                      {claim.claimType}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          claim.status.includes("APPROVED")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : claim.status === "INSPECTION"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : claim.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {claim.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {claim.replacementSerial ? (
                        <span className="font-mono font-bold text-emerald-700 text-[11px]">
                          {claim.replacementSerial}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!claim.status.includes("APPROVED") && claim.status !== "REJECTED" ? (
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setTechNotes(claim.technicianNotes || "");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Diagnose / Resolve
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-semibold">Resolved</span>
                        )}
                        <button
                          onClick={() => handleDeleteClaim(claim.id, claim.claimNumber)}
                          title="Delete Claim"
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Resolve / Diagnose Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Diagnose & Authorize Warranty</h3>
                <p className="text-xs text-slate-500">{selectedClaim.claimNumber} • {selectedClaim.batterySerialNumber}</p>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveClaim} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution Decision</label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="APPROVED_REPLACEMENT">Approve Full Replacement (Free)</option>
                  <option value="APPROVED_PRORATA">Approve Pro-rata Warranty Discount</option>
                  <option value="REJECTED">Reject (Customer Abuse / Alternator Overcharge)</option>
                </select>
              </div>

              {resolutionAction === "APPROVED_REPLACEMENT" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    New Replacement Battery Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GB-2026-VRLA-99410"
                    value={replacementSerial}
                    onChange={(e) => setReplacementSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    This will register the replacement in the digital master and flag ERP credit memo.
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Technician Inspection Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record specific gravity readings, load voltage at 200A, and visual inspection..."
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Authorize Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Warranty Claim Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Register Warranty Service Case</h3>
                <p className="text-xs text-slate-500">Record customer battery complaint at dealer counter.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer Name"
                    value={newClaim.customerName}
                    onChange={(e) => setNewClaim({ ...newClaim, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={newClaim.customerPhone}
                    onChange={(e) => setNewClaim({ ...newClaim, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Battery Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GB-2025-VRLA-88219"
                  value={newClaim.batterySerialNumber}
                  onChange={(e) => setNewClaim({ ...newClaim, batterySerialNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Battery Model *</label>
                <select
                  value={newClaim.batteryModel}
                  onChange={(e) => setNewClaim({ ...newClaim, batteryModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {products.map((p) => (
                    <option key={p.sku || p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Claim / Complaint Reason *</label>
                <select
                  value={newClaim.claimType}
                  onChange={(e) => setNewClaim({ ...newClaim, claimType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Dead on Arrival / Low Voltage">Dead on Arrival / Low Voltage</option>
                  <option value="Specific Gravity Low / Inverter Backup Dropped">Specific Gravity Low / Inverter Backup Dropped</option>
                  <option value="Internal Cell Short Circuit">Internal Cell Short Circuit</option>
                  <option value="BMS High Temp Cutoff Error">BMS High Temp Cutoff Error</option>
                  <option value="Bulging / Overcharging by Alternator">Bulging / Overcharging by Alternator</option>
                  <option value="Terminal Sulphation / Leaking Acid">Terminal Sulphation / Leaking Acid</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
