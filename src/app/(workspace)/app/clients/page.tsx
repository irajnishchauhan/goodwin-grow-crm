"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Users2,
  TrendingUp,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  brandName?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  activePackage?: string | null;
  monthlyRetainer: number;
  status: string;
  onboardingProgress: number;
  postsPlanned: number;
  postsCompleted: number;
  accountManagerName?: string | null;
  leadDesignerName?: string | null;
  contentWriterName?: string | null;
  mediaBuyerName?: string | null;
  brandGuidelines?: string | null;
  contractRenewalDate?: string | null;
  _count?: {
    projects: number;
    tasks: number;
    contentPosts: number;
    creativeAssets: number;
    adCampaigns: number;
    invoices: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    activePackage: "Growth Retainer (Social + Local SEO)",
    monthlyRetainer: "50000",
    postsPlanned: "12",
    accountManagerName: "Kunal Sharma",
    leadDesignerName: "Pooja Verma",
    contentWriterName: "Aman Gupta",
    mediaBuyerName: "Rohit Kapoor",
    brandGuidelines: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  async function fetchClients() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/agency/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openClient360(client: Client) {
    try {
      const res = await fetch(`/api/agency/clients/${client.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedClient(data.data);
      } else {
        setSelectedClient(client);
      }
    } catch (err) {
      setSelectedClient(client);
    }
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingClient ? `/api/agency/clients/${editingClient.id}` : "/api/agency/clients";
      const method = editingClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsClientModalOpen(false);
        setEditingClient(null);
        fetchClients();
      } else {
        alert(data.error || "Failed to save client");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving client");
    }
  }

  async function handleDeleteClient(id: string) {
    if (!confirm("Are you sure you want to remove this client from Goodwin Grow AI?")) return;
    
    // Optimistic UI update
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);

    try {
      const res = await fetch(`/api/agency/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete client");
        fetchClients();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting client");
      fetchClients();
    }
  }

  async function handleDeleteDemoClients() {
    if (
      !confirm(
        "Are you sure you want to remove all pre-seeded dummy/demo clients, tasks, and posts from this workspace?\n\nOnly the clients and data you manually add will remain."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/agency/clean-dummy-data", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "All dummy data deleted successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      fetchClients();
    }
  }

  function handleEditClick(client: Client) {
    setEditingClient(client);
    setFormData({
      name: client.name,
      brandName: client.brandName || "",
      industry: client.industry || "",
      website: client.website || "",
      phone: client.phone || "",
      email: client.email || "",
      city: client.city || "",
      state: client.state || "",
      activePackage: client.activePackage || "Growth Retainer",
      monthlyRetainer: String(client.monthlyRetainer),
      postsPlanned: String(client.postsPlanned || 12),
      accountManagerName: client.accountManagerName || "",
      leadDesignerName: client.leadDesignerName || "",
      contentWriterName: client.contentWriterName || "",
      mediaBuyerName: client.mediaBuyerName || "",
      brandGuidelines: client.brandGuidelines || "",
      status: client.status,
    });
    setIsClientModalOpen(true);
  }

  // Aggregate metrics
  const totalRetainer = clients.reduce((acc, c) => acc + Number(c.monthlyRetainer), 0);
  const totalPlanned = clients.reduce((acc, c) => acc + (c.postsPlanned || 0), 0);
  const totalCompleted = clients.reduce((acc, c) => acc + (c.postsCompleted || 0), 0);
  const avgDeliverableRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Client 360° Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Agency Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage agency client workspaces, active service retainers, monthly deliverable progress, and assigned pods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {clients.some((c) =>
            [
              "Sapna Washing Point",
              "Maa Amba Foam & Furnishing",
              "ZestPure",
              "FinEdge",
              "Mahalaxmi",
              "Nikita",
              "Sumit More",
            ].some((d) => c.name.toLowerCase().includes(d.toLowerCase()))
          ) && (
            <button
              type="button"
              onClick={handleDeleteDemoClients}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs transition cursor-pointer"
              title="Clean all pre-seeded dummy client records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Dummy Clients</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingClient(null);
              setFormData({
                name: "",
                brandName: "",
                industry: "",
                website: "",
                phone: "",
                email: "",
                city: "",
                state: "",
                activePackage: "Growth Retainer (Social + Local SEO)",
                monthlyRetainer: "50000",
                postsPlanned: "12",
                accountManagerName: "Kunal Sharma",
                leadDesignerName: "Pooja Verma",
                contentWriterName: "Aman Gupta",
                mediaBuyerName: "Rohit Kapoor",
                brandGuidelines: "",
                status: "ACTIVE",
              });
              setIsClientModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Retainers
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {clients.filter((c) => c.status === "ACTIVE").length}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Across D2C, Retail & B2B
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Retainer MRR
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(totalRetainer / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              100% recurring billing
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Deliverables
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {avgDeliverableRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {totalCompleted} completed / {totalPlanned} planned
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Pods
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              4 Pods
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              AM, Copy, Design & Media
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, brand, or account manager..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Status:</span>
          {["ALL", "ACTIVE", "ONBOARDING", "PAUSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Client / Brand</th>
                <th className="py-3.5 px-4">Business Type</th>
                <th className="py-3.5 px-4">Package</th>
                <th className="py-3.5 px-4">Monthly Value</th>
                <th className="py-3.5 px-4">Deliverables Progress</th>
                <th className="py-3.5 px-4">Manager & Pod</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No clients found matching the filter.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const rate =
                    client.postsPlanned > 0
                      ? Math.round((client.postsCompleted / client.postsPlanned) * 100)
                      : 0;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => openClient360(client)}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {client.name}
                        </div>
                        {client.brandName && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>{client.brandName}</span>
                            {client.city && <span>• {client.city}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {client.industry || "General Agency"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                          {client.activePackage || "Custom Retainer"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{Number(client.monthlyRetainer).toLocaleString("en-IN")}
                        <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-700">
                            {client.postsCompleted} of {client.postsPlanned} Posts
                          </span>
                          <span className="text-emerald-600 font-bold">{rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${Math.min(rate, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {client.accountManagerName || "Unassigned"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Design: {client.leadDesignerName || "Pooja"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            client.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {client.status.toLowerCase()}
                        </span>
                      </td>
                      <td
                        className="py-3.5 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openClient360(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            title="Open Client 360 Workspace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Client 360° Workspace Modal / Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wider border border-emerald-500/30">
                    Client 360° Workspace
                  </span>
                  <span className="text-xs text-slate-400">• {selectedClient.industry}</span>
                </div>
                <h2 className="text-2xl font-black mt-1 text-white">
                  {selectedClient.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                  {selectedClient.brandName && <span>Brand: {selectedClient.brandName}</span>}
                  {selectedClient.city && <span>Location: {selectedClient.city}, {selectedClient.state}</span>}
                  {selectedClient.phone && <span>Phone: {selectedClient.phone}</span>}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Illustrative Deliverables Dashboard from User Prompt */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Monthly Deliverables & Completion Status
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calculated from completed tasks, creative posts, and campaign assets
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {selectedClient.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-3xl font-black text-slate-900">
                      {selectedClient.postsPlanned || 12}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">
                      Posts Planned
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <div className="text-3xl font-black text-emerald-700">
                      {selectedClient.postsCompleted || 8}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 mt-1">
                      Completed
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                    <div className="text-3xl font-black text-amber-700">
                      {Math.max((selectedClient.postsPlanned || 12) - (selectedClient.postsCompleted || 8), 0)}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 mt-1">
                      Pending
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-center shadow-md shadow-emerald-600/20">
                    <div className="text-3xl font-black">
                      {selectedClient.postsPlanned > 0
                        ? Math.round(((selectedClient.postsCompleted || 8) / selectedClient.postsPlanned) * 100)
                        : 67}%
                    </div>
                    <div className="text-xs font-medium text-emerald-100 mt-1">
                      Monthly deliverables
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Package & Assigned Team Pod */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Active Service Package & Contract</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Service Plan:</span>
                      <span className="font-bold text-slate-800">{selectedClient.activePackage}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Monthly Retainer:</span>
                      <span className="font-bold text-emerald-700">₹{Number(selectedClient.monthlyRetainer).toLocaleString("en-IN")} /mo</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Website:</span>
                      <a
                        href={selectedClient.website || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        {selectedClient.website || "Not set"}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {selectedClient.brandGuidelines && (
                      <div className="pt-2">
                        <span className="text-slate-500 block mb-1">Brand Guidelines:</span>
                        <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700 text-[11px] leading-relaxed border border-slate-100">
                          {selectedClient.brandGuidelines}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-indigo-600" />
                    <span>Assigned Goodwin Grow Pod</span>
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          AM
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{selectedClient.accountManagerName || "Kunal Sharma"}</div>
                          <div className="text-[10px] text-slate-400">Account Manager</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600">Lead Contact</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                          DS
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{selectedClient.leadDesignerName || "Pooja Verma"}</div>
                          <div className="text-[10px] text-slate-400">Lead Graphic & Video Designer</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-600">Creatives</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                          CW
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{selectedClient.contentWriterName || "Aman Gupta"}</div>
                          <div className="text-[10px] text-slate-400">Copywriter & Reel Scriptwriter</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600">Scripts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Modules Quick Links */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Quick Actions For {selectedClient.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <a
                    href={`/app/tasks?clientId=${selectedClient.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-center transition group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition" />
                    <span className="font-semibold text-slate-800">Workflow Tasks</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">7-Stage Delivery</span>
                  </a>

                  <a
                    href={`/app/content-calendar?clientId=${selectedClient.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-center transition group"
                  >
                    <Share2 className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition" />
                    <span className="font-semibold text-slate-800">Social Calendar</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Planned Posts</span>
                  </a>

                  <a
                    href={`/app/creative-approvals?clientId=${selectedClient.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 flex flex-col items-center justify-center text-center transition group"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition" />
                    <span className="font-semibold text-slate-800">Creative Review</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Asset Approvals</span>
                  </a>

                  <a
                    href={`/app/invoices?clientId=${selectedClient.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex flex-col items-center justify-center text-center transition group"
                  >
                    <DollarSign className="w-5 h-5 text-teal-600 mb-1 group-hover:scale-110 transition" />
                    <span className="font-semibold text-slate-800">Retainer Billing</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">GST Invoices</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close 360° View
              </button>
              <button
                onClick={() => {
                  const clientToEdit = selectedClient;
                  setSelectedClient(null);
                  handleEditClick(clientToEdit);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Edit Client Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingClient ? "Edit Agency Client" : "Add New Agency Client"}
                </h3>
                <p className="text-xs text-slate-500">
                  Onboard a new marketing client into Goodwin Grow AI workspace.
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sapna Washing Point"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Sapna Detailing & Car Spa"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry / Business Type
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. Automotive Detailing"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98930 11223"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Indore"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Madhya Pradesh"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Package
                  </label>
                  <select
                    value={formData.activePackage}
                    onChange={(e) => setFormData({ ...formData, activePackage: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Growth Retainer (Social + Local SEO)">Growth Retainer (Social + Local SEO)</option>
                    <option value="Enterprise Creative & Meta Ads Retainer">Enterprise Creative & Meta Ads Retainer</option>
                    <option value="Hyper-Growth Performance Retainer (Meta + Google)">Hyper-Growth Performance Retainer (Meta + Google)</option>
                    <option value="360° Corporate Brand Experience & Influencers">360° Corporate Brand Experience & Influencers</option>
                    <option value="Starter Digital Presence & Local Leads">Starter Digital Presence & Local Leads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Retainer Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRetainer}
                    onChange={(e) => setFormData({ ...formData, monthlyRetainer: e.target.value })}
                    placeholder="50000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Monthly Posts
                  </label>
                  <input
                    type="number"
                    value={formData.postsPlanned}
                    onChange={(e) => setFormData({ ...formData, postsPlanned: e.target.value })}
                    placeholder="12"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Manager
                  </label>
                  <input
                    type="text"
                    value={formData.accountManagerName}
                    onChange={(e) => setFormData({ ...formData, accountManagerName: e.target.value })}
                    placeholder="Kunal Sharma"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Guidelines & Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.brandGuidelines}
                  onChange={(e) => setFormData({ ...formData, brandGuidelines: e.target.value })}
                  placeholder="Primary colors, tone of voice, preferred hashtags, target demographic..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  {editingClient ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
