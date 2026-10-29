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
  Sparkles,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { INVOICE_CATALOG_ITEMS } from "@/lib/agency/packages";

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
  clientName?: string | null;
  clientBillingDetails?: any;
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

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [clientType, setClientType] = useState<"EXISTING" | "NEW">("EXISTING");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientBrand, setNewClientBrand] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientGstin, setNewClientGstin] = useState("");
  const [autoEnrollClient, setAutoEnrollClient] = useState(true);

  // Service Selection & Flexible Line Items
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ description: string; amount: number }>>([
    {
      description: "Basic — Digital Foundation & Local Leads (6 Creatives, Local SEO & Review Monitoring)",
      amount: 18000,
    },
  ]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AgencyInvoice | null>(null);
  const [editItems, setEditItems] = useState<Array<{ description: string; amount: number }>>([]);
  const [editClientId, setEditClientId] = useState<string>("");
  const [editClientName, setEditClientName] = useState<string>("");
  const [editClientBrand, setEditClientBrand] = useState<string>("");
  const [editClientEmail, setEditClientEmail] = useState<string>("");
  const [editClientPhone, setEditClientPhone] = useState<string>("");
  const [editClientGstin, setEditClientGstin] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("SENT");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Razorpay UPI");
  const [workspaceSettings, setWorkspaceSettings] = useState<{
    name: string;
    code: string;
    logoUrl?: string | null;
    businessEmail?: string;
    phone?: string;
    address?: string;
  } | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchWorkspaceSettings();
  }, [statusFilter]);

  async function fetchWorkspaceSettings() {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setWorkspaceSettings(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

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

  function handleSelectCatalogItem(id: string) {
    setSelectedCatalogId(id);
    const found = INVOICE_CATALOG_ITEMS.find((it) => it.id === id);
    if (!found) return;

    setLineItems([
      {
        description: found.defaultDescription,
        amount: found.defaultPrice,
      },
    ]);
  }

  function handleAddLineItem() {
    setLineItems((prev) => [
      ...prev,
      { description: "Additional Strategic Deliverable / Ad-on Service", amount: 12000 },
    ]);
  }

  function handleRemoveLineItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleLineItemChange(idx: number, field: "description" | "amount", val: any) {
    setLineItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: field === "amount" ? Number(val) || 0 : val } : it))
    );
  }

  const computedSubtotal = lineItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const computedTax = Math.round(computedSubtotal * 0.18);
  const computedTotal = computedSubtotal + computedTax;

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (clientType === "EXISTING" && !clientId) {
      alert("Please select an enrolled client");
      return;
    }
    if (clientType === "NEW" && !newClientName.trim() && !newClientBrand.trim()) {
      alert("Please enter the client or brand name");
      return;
    }
    if (lineItems.length === 0 || computedSubtotal <= 0) {
      alert("Please add at least one line item with a valid price");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/agency/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientType === "EXISTING" ? clientId : "NEW",
          isNewClient: clientType === "NEW",
          newClientName,
          newClientBrand,
          newClientEmail,
          newClientPhone,
          newClientGstin,
          autoEnrollClient,
          subtotal: computedSubtotal,
          taxAmount: computedTax,
          totalAmount: computedTotal,
          dueDate,
          items: lineItems,
          paymentMethod: "Bank Transfer / UPI",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        // Reset form
        setClientId("");
        setNewClientName("");
        setNewClientBrand("");
        setNewClientEmail("");
        setNewClientPhone("");
        setNewClientGstin("");
        setLineItems([
          {
            description: "Basic — Digital Foundation & Local Leads (6 Creatives, Local SEO & Review Monitoring)",
            amount: 18000,
          },
        ]);
        fetchInvoices();
        fetchClients();
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
    setEditClientId(inv.client?.id || "");
    setEditClientName(inv.client?.name || inv.clientName || "");
    setEditClientBrand(inv.client?.brandName || inv.clientBillingDetails?.brandName || "");
    setEditClientEmail(inv.client?.email || inv.clientBillingDetails?.email || "");
    setEditClientPhone(inv.client?.phone || inv.clientBillingDetails?.phone || "");
    setEditClientGstin(inv.clientBillingDetails?.gstin || "");
    setEditDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "");
    setEditStatus(inv.status);
    setEditPaymentMethod(inv.paymentMethod || "Razorpay UPI");

    const parsedItems =
      Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items.map((it: any) => ({
            description: it.description || "Agency Digital Marketing Services",
            amount: Number(it.amount) || 0,
          }))
        : [
            {
              description: "Agency Digital Marketing Services",
              amount: Number(inv.subtotal) || 0,
            },
          ];
    setEditItems(parsedItems);
    setEditModalOpen(true);
  }

  function handleAddEditLineItem() {
    setEditItems((prev) => [
      ...prev,
      { description: "Additional Strategic Deliverable / Add-on Service", amount: 12000 },
    ]);
  }

  function handleRemoveEditLineItem(idx: number) {
    if (editItems.length <= 1) return;
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleEditLineItemChange(idx: number, field: "description" | "amount", val: any) {
    setEditItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: field === "amount" ? Number(val) || 0 : val } : it))
    );
  }

  const editComputedSubtotal = editItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const editComputedTax = Math.round(editComputedSubtotal * 0.18);
  const editComputedTotal = editComputedSubtotal + editComputedTax;

  async function handleUpdateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!editingInvoice) return;
    setSaving(true);

    const subVal = editComputedSubtotal;
    const taxVal = editComputedTax;
    const totalVal = editComputedTotal;
    const updatedBillingDetails = {
      ...(editingInvoice.clientBillingDetails || {}),
      brandName: editClientBrand || null,
      email: editClientEmail || null,
      phone: editClientPhone || null,
      gstin: editClientGstin || null,
    };

    // Optimistic UI update
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              clientName: editClientName || inv.clientName,
              clientBillingDetails: updatedBillingDetails,
              subtotal: subVal,
              taxAmount: taxVal,
              totalAmount: totalVal,
              status: editStatus,
              dueDate: editDueDate || inv.dueDate,
              paymentMethod: editPaymentMethod,
              items: editItems,
            }
          : inv
      )
    );

    try {
      const res = await fetch(`/api/agency/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editClientId || editingInvoice.client?.id || null,
          clientName: editClientName || editingInvoice.clientName,
          clientBillingDetails: updatedBillingDetails,
          subtotal: subVal,
          taxAmount: taxVal,
          totalAmount: totalVal,
          status: editStatus,
          dueDate: editDueDate,
          paymentMethod: editPaymentMethod,
          items: editItems,
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
                      <div className="font-semibold text-slate-800">{inv.client?.name || inv.clientName || "Client"}</div>
                      {(inv.client?.brandName || inv.clientBillingDetails?.brandName) && (
                        <div className="text-[10px] text-slate-400">{inv.client?.brandName || inv.clientBillingDetails?.brandName}</div>
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
                <div className="flex items-center gap-3.5">
                  {workspaceSettings?.logoUrl ? (
                    <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
                      <img src={workspaceSettings.logoUrl} alt={workspaceSettings.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 p-2">
                      <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="url(#gg-gradient)" />
                        <path d="M12 28V12L20 8L28 12V28L20 32L12 28Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M20 14V26M14 23L20 26L26 23M14 17L20 20L26 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                          <linearGradient id="gg-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#059669" />
                            <stop offset="0.5" stopColor="#0d9488" />
                            <stop offset="1" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                      {workspaceSettings?.name || "GOODWIN GROW AI"}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                      <span>{workspaceSettings?.code?.includes("batteries") ? "Battery Sales & Distribution" : "Enterprise Operating System"}</span>
                      <span>•</span>
                      <span>18% GST Compliant</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      {workspaceSettings?.address || "Level 9, Cyber City Tower B, DLF Cyber City, Gurugram, Haryana - 122002"}<br />
                      GSTIN: 06AABCU9603R1ZM • {workspaceSettings?.businessEmail || "support@goodwingrowai.com"}
                    </div>
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
                  {selectedInvoice.client?.name || selectedInvoice.clientName || "Direct Client"}
                </div>
                {(selectedInvoice.client?.brandName || selectedInvoice.clientBillingDetails?.brandName) && (
                  <div className="text-slate-500 font-medium">
                    {selectedInvoice.client?.brandName || selectedInvoice.clientBillingDetails?.brandName}
                  </div>
                )}
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {(selectedInvoice.client?.email || selectedInvoice.clientBillingDetails?.email) && (
                    <span>Email: {selectedInvoice.client?.email || selectedInvoice.clientBillingDetails?.email} • </span>
                  )}
                  {(selectedInvoice.client?.phone || selectedInvoice.clientBillingDetails?.phone) && (
                    <span>Phone: {selectedInvoice.client?.phone || selectedInvoice.clientBillingDetails?.phone}</span>
                  )}
                  {selectedInvoice.clientBillingDetails?.gstin && (
                    <span> • GSTIN: {selectedInvoice.clientBillingDetails.gstin}</span>
                  )}
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
                <div>Account Name: {workspaceSettings?.name || "Goodwin Grow AI Solutions Private Limited"}</div>
                <div>HDFC Bank • A/C No: 50200084920194 • IFSC: HDFC0000240</div>
                <div>UPI ID: {workspaceSettings?.businessEmail?.split("@")[0] || "goodwingrowai"}@hdfcbank</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generate Client Tax Invoice</h3>
                  <p className="text-xs text-slate-500">18% GST Compliant • Goodwin Grow AI Official Invoice</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Client Selection Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">1. Client Billing Entity</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClientType("EXISTING")}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      clientType === "EXISTING"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Enrolled CRM Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientType("NEW")}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      clientType === "NEW"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>New / Ad-Hoc Client</span>
                  </button>
                </div>

                {clientType === "EXISTING" ? (
                  <div className="mt-2">
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="">Select an enrolled client from CRM...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.brandName ? `(${c.brandName})` : ""} — ₹{Number(c.monthlyRetainer).toLocaleString("en-IN")}/mo
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Contact Name *</label>
                        <input
                          type="text"
                          required={clientType === "NEW"}
                          placeholder="e.g. Vikramaditya Sharma"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand / Business Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sharma Jewels & Co"
                          value={newClientBrand}
                          onChange={(e) => setNewClientBrand(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Email</label>
                        <input
                          type="email"
                          placeholder="accounts@clientbrand.com"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Phone</label>
                        <input
                          type="tel"
                          placeholder="+91 98290 12345"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client GSTIN (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 08AABCS1429B1Z0"
                        value={newClientGstin}
                        onChange={(e) => setNewClientGstin(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono uppercase"
                      />
                    </div>

                    <label className="flex items-center gap-2 pt-1 text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoEnrollClient}
                        onChange={(e) => setAutoEnrollClient(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Auto-enroll this new client profile directly in CRM</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Standard Service Dropdown Selection */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    2. Service Catalog Selector
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick-fill rate & deliverables</span>
                  </span>
                </div>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogItem(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl font-semibold text-emerald-900 cursor-pointer"
                >
                  <option value="">Choose a Standard Service Package or Retainer...</option>
                  <optgroup label="Standard Retainer Packages (Basic, Standard, Premium)">
                    {INVOICE_CATALOG_ITEMS.filter((it) => it.category === "Core Retainer").map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} — ₹{it.defaultPrice.toLocaleString("en-IN")} ({it.cadence})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Specialized Services & Retainers">
                    {INVOICE_CATALOG_ITEMS.filter((it) => it.category === "Specialized Service").map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} — ₹{it.defaultPrice.toLocaleString("en-IN")} ({it.cadence})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Development & Add-On Services">
                    {INVOICE_CATALOG_ITEMS.filter((it) => it.category === "Add-On Service" || it.category === "Development" || it.category === "Custom").map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} — ₹{it.defaultPrice.toLocaleString("en-IN")} ({it.cadence})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Flexible Line Items */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    3. Service Line Items & Pricing (Customizable)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Line Item #{idx + 1}</span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                        placeholder="Deliverable details, posts count, platform scope..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 text-[11px] font-medium">Taxable Amount (₹):</span>
                        <input
                          type="number"
                          required
                          value={item.amount}
                          onChange={(e) => handleLineItemChange(idx, "amount", e.target.value)}
                          className="w-36 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date & Financial Totals */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/75 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{computedSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Total: CGST 9% + SGST 9%):</span>
                    <span className="font-bold text-slate-900">₹{computedTax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-emerald-950 pt-2 border-t border-emerald-200">
                    <span>Grand Total Receivable:</span>
                    <span className="text-emerald-700 text-base">₹{computedTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate & Issue Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Invoice {editingInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-500">Update client details, line items, payment status, or due date.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enrolled Client (Optional)</label>
                  <select
                    value={editClientId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditClientId(val);
                      const found = clients.find((c) => c.id === val);
                      if (found) {
                        setEditClientName(found.name || "");
                        setEditClientBrand(found.brandName || "");
                        setEditClientEmail(found.email || "");
                        setEditClientPhone(found.phone || "");
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">Custom / Direct Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.brandName ? `(${c.brandName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold uppercase text-slate-500">Client Billing Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Contact / Entity Name *</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={editClientBrand}
                      onChange={(e) => setEditClientBrand(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={editClientGstin}
                      onChange={(e) => setEditClientGstin(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Line Items ({editItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditLineItem}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Line Item #{idx + 1}</span>
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={item.description}
                        onChange={(e) => handleEditLineItemChange(idx, "description", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 text-[11px] font-medium">Taxable Amount (₹):</span>
                        <input
                          type="number"
                          required
                          value={item.amount}
                          onChange={(e) => handleEditLineItemChange(idx, "amount", e.target.value)}
                          className="w-36 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Bank Transfer / UPI">Bank Transfer / UPI</option>
                    <option value="Razorpay UPI">Razorpay UPI</option>
                    <option value="HDFC Bank Transfer (NEFT/RTGS)">HDFC Bank Transfer (NEFT/RTGS)</option>
                    <option value="Corporate Credit Card">Corporate Credit Card</option>
                    <option value="Cheque / Draft">Cheque / Demand Draft</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-100 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{editComputedSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-bold text-slate-900">₹{editComputedTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-emerald-200/80 text-sm font-black text-emerald-950">
                  <span>Total with 18% GST:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{editComputedTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
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
