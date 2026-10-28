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
  ShieldCheck,
  Lock,
  Calendar,
  Check,
  AlertTriangle,
  ArrowRight,
  Tag,
  BookOpen,
  MessageSquare,
  Target,
  Pin,
  Percent,
  CreditCard,
  Receipt,
  RotateCcw,
  Key,
  Eye,
  EyeOff,
  Copy,
  Shield,
} from "lucide-react";
import { SERVICE_PACKAGES, ADD_ON_SERVICES, getPackageByName, calculatePackageProfitability } from "@/lib/agency/packages";

interface ClientNote {
  id: string;
  clientId: string;
  title: string;
  content: string;
  category: "REQUIREMENT" | "MEETING_NOTE" | "STRATEGY" | "FOLLOW_UP" | "IMPORTANT_INFO";
  isConfidential: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface ClientCredentialItem {
  id: string;
  tenantId: string;
  clientId: string;
  platform: string;
  accountIdentifier: string;
  password?: string;
  decryptedPassword?: string;
  maskedPassword?: string;
  loginUrl?: string | null;
  recoveryDetails?: string | null;
  accessLevel: string;
  notes?: string | null;
  isVerified: boolean;
  createdAt: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

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
  accountManagerId?: string | null;
  leadDesignerName?: string | null;
  contentWriterName?: string | null;
  mediaBuyerName?: string | null;
  brandGuidelines?: string | null;
  contractStartDate?: string | null;
  contractRenewalDate?: string | null;
  contractEndDate?: string | null;
  billingCycle?: string | null;
  packageStatus?: string | null;
  addOnServices?: any[] | null;
  customPricing?: boolean;
  estimatedDeliveryCost?: number | null;
  confidentialAccess?: {
    canAccessNotes: boolean;
    isSuperAdmin: boolean;
    isAssignedAdmin: boolean;
  };
  _count?: {
    notes?: number;
    credentials?: number;
    projects?: number;
    tasks?: number;
    contentPosts?: number;
    creativeAssets?: number;
    adCampaigns?: number;
    invoices?: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [client360Tab, setClient360Tab] = useState<"overview" | "credentials" | "notes" | "package" | "billing">("overview");

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Notes State for Selected Client
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteCategoryFilter, setNoteCategoryFilter] = useState("ALL");
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "REQUIREMENT",
    isConfidential: true,
  });

  // Client Credentials Vault State
  const [credentials, setCredentials] = useState<ClientCredentialItem[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [isAddCredModalOpen, setIsAddCredModalOpen] = useState(false);
  const [savingCred, setSavingCred] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({
    platform: "Meta Business Suite",
    accountIdentifier: "",
    password: "",
    loginUrl: "",
    recoveryDetails: "",
    accessLevel: "ADMIN",
    notes: "",
  });

  // Client Form State
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
    billingCycle: "MONTHLY",
    packageStatus: "ACTIVE",
    customPricing: false,
    estimatedDeliveryCost: "15000",
    contractStartDate: new Date().toISOString().slice(0, 10),
    contractRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    accountManagerName: "",
    accountManagerId: "",
    leadDesignerName: "",
    contentWriterName: "",
    mediaBuyerName: "",
    brandGuidelines: "",
    status: "ACTIVE",
    addOnServices: [] as string[],
  });

  function sanitizePodMember(name?: string | null): string | null {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    if (lower.includes("pooja") || lower.includes("aman") || lower.includes("kunal sharma")) {
      return null;
    }
    return name;
  }

  useEffect(() => {
    fetchClients();
    fetchTeamMembers();
  }, [search, statusFilter]);

  async function fetchTeamMembers() {
    try {
      const res = await fetch("/api/team?activeOnly=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeamMembers(data.data);
      }
    } catch (err) {
      console.error("Failed to load team members:", err);
    }
  }

  async function fetchClients() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/agency/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const sanitized = data.data.map((c: Client) => ({
          ...c,
          accountManagerName: sanitizePodMember(c.accountManagerName),
          leadDesignerName: sanitizePodMember(c.leadDesignerName),
          contentWriterName: sanitizePodMember(c.contentWriterName),
        }));
        setClients(sanitized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openClient360(client: Client, defaultTab: "overview" | "credentials" | "notes" | "package" | "billing" = "overview") {
    try {
      setClient360Tab(defaultTab);
      const res = await fetch(`/api/agency/clients/${client.id}`);
      const data = await res.json();
      const clientObj = data.success && data.data ? data.data : client;
      const sanitized = {
        ...clientObj,
        accountManagerName: sanitizePodMember(clientObj.accountManagerName),
        leadDesignerName: sanitizePodMember(clientObj.leadDesignerName),
        contentWriterName: sanitizePodMember(clientObj.contentWriterName),
      };
      setSelectedClient(sanitized);

      // Fetch confidential notes & credentials
      fetchNotesForClient(client.id);
      fetchCredentialsForClient(client.id);
    } catch (err) {
      setSelectedClient({
        ...client,
        accountManagerName: sanitizePodMember(client.accountManagerName),
        leadDesignerName: sanitizePodMember(client.leadDesignerName),
        contentWriterName: sanitizePodMember(client.contentWriterName),
      });
      fetchNotesForClient(client.id);
      fetchCredentialsForClient(client.id);
    }
  }

  async function fetchCredentialsForClient(clientId: string) {
    try {
      setCredentialsLoading(true);
      const res = await fetch(`/api/agency/clients/${clientId}/credentials`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCredentials(data.data);
      } else {
        setCredentials([]);
      }
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
      setCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  }

  async function handleCreateCredential(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;

    if (selectedClient.confidentialAccess?.canAccessNotes === false) {
      alert(`Access Restricted: You are not the assigned Account Manager (${selectedClient.accountManagerName || "Unassigned"}) for ${selectedClient.name}. Only the assigned manager and Super Admins can add credentials.`);
      return;
    }

    try {
      setSavingCred(true);
      const res = await fetch(`/api/agency/clients/${selectedClient.id}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credForm),
      });

      const data = await res.json();
      if (data.success) {
        setCredForm({
          platform: "Meta Business Suite",
          accountIdentifier: "",
          password: "",
          loginUrl: "",
          recoveryDetails: "",
          accessLevel: "ADMIN",
          notes: "",
        });
        setIsAddCredModalOpen(false);
        fetchCredentialsForClient(selectedClient.id);
        fetchClients(); // Refresh credentials count
      } else {
        alert(data.error || "Failed to save client credential");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSavingCred(false);
    }
  }

  async function handleDeleteCredential(credId: string) {
    if (!selectedClient) return;
    if (!confirm("Are you sure you want to permanently delete this client login credential?")) return;

    try {
      const res = await fetch(`/api/agency/clients/${selectedClient.id}/credentials/${credId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(credentials.filter((c) => c.id !== credId));
        fetchClients();
      } else {
        alert(data.error || "Failed to delete credential");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete credential");
    }
  }

  function handleCopyPassword(credId: string, pass?: string) {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedCredId(credId);
    setTimeout(() => setCopiedCredId(null), 2000);
  }

  function toggleRevealPassword(credId: string) {
    setRevealedPasswords((prev) => ({ ...prev, [credId]: !prev[credId] }));
  }

  async function fetchNotesForClient(clientId: string) {
    try {
      setNotesLoading(true);
      const res = await fetch(`/api/agency/clients/${clientId}/notes`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotes(data.data);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;

    if (selectedClient.confidentialAccess?.canAccessNotes === false) {
      alert(`Access Restricted: You are not the assigned Account Manager (${selectedClient.accountManagerName || "Unassigned"}) for ${selectedClient.name}. Only the assigned manager and Super Admins can add notes.`);
      return;
    }

    try {
      setSavingNote(true);
      const res = await fetch(`/api/agency/clients/${selectedClient.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });

      const data = await res.json();
      if (data.success) {
        setNoteForm({
          title: "",
          content: "",
          category: "REQUIREMENT",
          isConfidential: true,
        });
        setIsAddNoteModalOpen(false);
        fetchNotesForClient(selectedClient.id);
        fetchClients(); // Refresh notes count
      } else {
        alert(data.error || "Failed to save note");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!selectedClient) return;
    if (!confirm("Are you sure you want to delete this confidential client record?")) return;

    try {
      const res = await fetch(`/api/agency/clients/${selectedClient.id}/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter((n) => n.id !== noteId));
        fetchClients();
      } else {
        alert(data.error || "Failed to delete note");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete note");
    }
  }

  function handlePackageSelect(pkgName: string) {
    const pkg = getPackageByName(pkgName);
    if (pkg) {
      setFormData({
        ...formData,
        activePackage: pkg.name,
        monthlyRetainer: formData.customPricing ? formData.monthlyRetainer : String(pkg.price),
        postsPlanned: String(pkg.defaultPostsPlanned),
        estimatedDeliveryCost: String(pkg.estimatedDeliveryCost),
      });
    } else {
      setFormData({ ...formData, activePackage: pkgName });
    }
  }

  function toggleAddOn(addonId: string) {
    const exists = formData.addOnServices.includes(addonId);
    const updated = exists
      ? formData.addOnServices.filter((id) => id !== addonId)
      : [...formData.addOnServices, addonId];
    setFormData({ ...formData, addOnServices: updated });
  }

  function handleAddClientClick() {
    setEditingClient(null);
    const defaultPkg = SERVICE_PACKAGES[1]; // Growth Retainer
    setFormData({
      name: "",
      brandName: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      city: "",
      state: "",
      activePackage: defaultPkg.name,
      monthlyRetainer: String(defaultPkg.price),
      postsPlanned: String(defaultPkg.defaultPostsPlanned),
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      customPricing: false,
      estimatedDeliveryCost: String(defaultPkg.estimatedDeliveryCost),
      contractStartDate: new Date().toISOString().slice(0, 10),
      contractRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      accountManagerName: teamMembers[0]?.fullName || "",
      accountManagerId: teamMembers[0]?.id || "",
      leadDesignerName: "",
      contentWriterName: "",
      mediaBuyerName: "",
      brandGuidelines: "",
      status: "ACTIVE",
      addOnServices: [],
    });
    setIsClientModalOpen(true);
  }

  function handleEditClick(client: Client) {
    setEditingClient(client);
    const addOnIds = Array.isArray(client.addOnServices)
      ? client.addOnServices.map((a: any) => (typeof a === "string" ? a : a.id))
      : [];

    setFormData({
      name: client.name || "",
      brandName: client.brandName || "",
      industry: client.industry || "",
      website: client.website || "",
      phone: client.phone || "",
      email: client.email || "",
      city: client.city || "",
      state: client.state || "",
      activePackage: client.activePackage || "Growth Retainer (Social + Local SEO)",
      monthlyRetainer: String(client.monthlyRetainer || 50000),
      postsPlanned: String(client.postsPlanned || 12),
      billingCycle: client.billingCycle || "MONTHLY",
      packageStatus: client.packageStatus || client.status || "ACTIVE",
      customPricing: Boolean(client.customPricing),
      estimatedDeliveryCost: String(client.estimatedDeliveryCost || 15000),
      contractStartDate: client.contractStartDate ? new Date(client.contractStartDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      contractRenewalDate: client.contractRenewalDate ? new Date(client.contractRenewalDate).toISOString().slice(0, 10) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      contractEndDate: client.contractEndDate ? new Date(client.contractEndDate).toISOString().slice(0, 10) : "",
      accountManagerName: client.accountManagerName || "",
      accountManagerId: client.accountManagerId || "",
      leadDesignerName: client.leadDesignerName || "",
      contentWriterName: client.contentWriterName || "",
      mediaBuyerName: client.mediaBuyerName || "",
      brandGuidelines: client.brandGuidelines || "",
      status: client.status || "ACTIVE",
      addOnServices: addOnIds,
    });
    setIsClientModalOpen(true);
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingClient ? `/api/agency/clients/${editingClient.id}` : "/api/agency/clients";
      const method = editingClient ? "PUT" : "POST";

      const payload = {
        ...formData,
        monthlyRetainer: Number(formData.monthlyRetainer) || 0,
        postsPlanned: Number(formData.postsPlanned) || 0,
        estimatedDeliveryCost: Number(formData.estimatedDeliveryCost) || 0,
        addOnServices: formData.addOnServices.map((id) => {
          const addonDef = ADD_ON_SERVICES.find((a) => a.id === id);
          return addonDef ? { id: addonDef.id, name: addonDef.name, price: addonDef.price } : { id };
        }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsClientModalOpen(false);
        fetchClients();
        if (selectedClient && selectedClient.id === (editingClient?.id || data.data?.id)) {
          openClient360(data.data || selectedClient);
        }
      } else {
        alert(data.error || "Failed to save client");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit client form");
    }
  }

  async function handleDeleteClient(id: string, name: string) {
    if (!confirm(`Are you sure you want to permanently delete '${name}' and all associated tasks, deliverables, and confidential records?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/agency/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setClients(clients.filter((c) => c.id !== id));
        if (selectedClient?.id === id) {
          setSelectedClient(null);
        }
      } else {
        alert(data.error || "Failed to delete client");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete client");
    }
  }

  // Calculated Top KPIs
  const totalMRR = clients.reduce((acc, c) => acc + (c.status === "ACTIVE" ? Number(c.monthlyRetainer) : 0), 0);
  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;
  const onboardingCount = clients.filter((c) => c.status === "ONBOARDING").length;

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    if (noteCategoryFilter === "ALL") return true;
    return n.category === noteCategoryFilter;
  });

  // Calculate gross margin preview in form
  const formProfit = calculatePackageProfitability(
    Number(formData.monthlyRetainer) || 0,
    Number(formData.estimatedDeliveryCost) || 0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Client Accounts & Pod Assignments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {clients.length} Total Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized packages, confidential client notes & records, pod assignments, contract renewals, and delivery margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddClientClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Client</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Retainer MRR
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalMRR.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Across {activeCount} active retainers
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Retainers
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {activeCount}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {onboardingCount} currently in onboarding
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Package Standardization
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              10 Plans
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              5 Core + 5 Demand-Driven
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Secure Data Governance
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              Super Admin & AM
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              Restricted confidential notes
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
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
            placeholder="Search by client, brand, package, or account manager..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500 shrink-0">Status:</span>
          {["ALL", "ACTIVE", "ONBOARDING", "PAUSED", "CHURNED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
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
                <th className="py-3.5 px-4">Service Package</th>
                <th className="py-3.5 px-4">Monthly Retainer</th>
                <th className="py-3.5 px-4">Contract & Renewal</th>
                <th className="py-3.5 px-4">Account Manager</th>
                <th className="py-3.5 px-4">Confidential Records</th>
                <th className="py-3.5 px-4">Credentials Vault</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No clients found matching the filter.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const renewalDate = client.contractRenewalDate ? new Date(client.contractRenewalDate) : null;
                  const daysToRenewal = renewalDate ? Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => openClient360(client, "overview")}
                    >
                      {/* Client / Brand */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-emerald-700 transition">
                              {client.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {client.brandName ? client.brandName : client.industry || "General Retainer"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[170px]">{client.activePackage}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {client.billingCycle || "MONTHLY"} Cycle
                        </div>
                      </td>

                      {/* Monthly Value */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{Number(client.monthlyRetainer).toLocaleString("en-IN")}
                          <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                        </div>
                        {client.estimatedDeliveryCost ? (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Cost: ₹{Number(client.estimatedDeliveryCost).toLocaleString("en-IN")}
                          </div>
                        ) : null}
                      </td>

                      {/* Contract & Renewal */}
                      <td className="py-3.5 px-4">
                        {renewalDate ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700">
                                {renewalDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                            {daysToRenewal !== null && (
                              <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                daysToRenewal < 0
                                  ? "bg-rose-100 text-rose-800"
                                  : daysToRenewal <= 30
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {daysToRenewal < 0 ? "Expired Renewal" : `Renews in ${daysToRenewal}d`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No renewal set</span>
                        )}
                      </td>

                      {/* Account Manager */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                            {(client.accountManagerName || "U").slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {client.accountManagerName || "Unassigned"}
                            </div>
                            <div className="text-[10px] text-slate-400">Account Manager</div>
                          </div>
                        </div>
                      </td>

                      {/* Confidential Notes Count */}
                      <td className="py-3.5 px-4">
                        {client.confidentialAccess?.canAccessNotes === false ? (
                          <span
                            title={`Confidential: Restricted to ${client.accountManagerName || "Assigned AM"} & Super Admin`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-medium text-[11px]"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Restricted</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openClient360(client, "notes");
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-semibold text-[11px] transition cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-indigo-600" />
                            <span>{client._count?.notes || 0} Notes</span>
                          </button>
                        )}
                      </td>

                      {/* Client Login Credentials Vault */}
                      <td className="py-3.5 px-4">
                        {client.confidentialAccess?.canAccessNotes === false ? (
                          <span
                            title={`Confidential: Restricted to ${client.accountManagerName || "Assigned AM"} & Super Admin`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-medium text-[11px]"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Restricted</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openClient360(client, "credentials");
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold text-[11px] transition cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>{client._count?.credentials || 0} Logins</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          client.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : client.status === "ONBOARDING"
                            ? "bg-blue-100 text-blue-800"
                            : client.status === "PAUSED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{client.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openClient360(client, "overview")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Open Client 360 Workspace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Client & Contract"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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

      {/* ========================================================================= */}
      {/* CLIENT 360° WORKSPACE MODAL (ENHANCED WITH SECURE NOTES, PACKAGES & CONTRACTS) */}
      {/* ========================================================================= */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wider border border-emerald-500/30">
                    Client 360° Workspace
                  </span>
                  <span className="text-xs text-slate-400">• {selectedClient.industry || "Marketing Retainer"}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedClient.status === "ACTIVE" ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>
                <h2 className="text-2xl font-black mt-1 text-white flex items-center gap-2">
                  <span>{selectedClient.name}</span>
                  {selectedClient.brandName && (
                    <span className="text-sm font-normal text-slate-400">({selectedClient.brandName})</span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-4">
                  {selectedClient.city && <span>Location: {selectedClient.city}, {selectedClient.state}</span>}
                  {selectedClient.phone && <span>Phone: {selectedClient.phone}</span>}
                  {selectedClient.email && <span>Email: {selectedClient.email}</span>}
                </p>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/80">
              <button
                onClick={() => setClient360Tab("overview")}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  client360Tab === "overview"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Deliverables & Pod</span>
              </button>

              <button
                onClick={() => {
                  setClient360Tab("credentials");
                  if (selectedClient.confidentialAccess?.canAccessNotes !== false) {
                    fetchCredentialsForClient(selectedClient.id);
                  }
                }}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  client360Tab === "credentials"
                    ? "border-amber-600 text-amber-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Credentials Vault</span>
                {selectedClient.confidentialAccess?.canAccessNotes === false ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-500 flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                    {selectedClient._count?.credentials || credentials.length || 0}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setClient360Tab("notes");
                  if (selectedClient.confidentialAccess?.canAccessNotes !== false) {
                    fetchNotesForClient(selectedClient.id);
                  }
                }}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  client360Tab === "notes"
                    ? "border-indigo-600 text-indigo-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Notes & Records</span>
                {selectedClient.confidentialAccess?.canAccessNotes === false ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-500 flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                    {selectedClient._count?.notes || notes.length || 0}
                  </span>
                )}
              </button>

              <button
                onClick={() => setClient360Tab("package")}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  client360Tab === "package"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Package & Contract</span>
              </button>

              <button
                onClick={() => setClient360Tab("billing")}
                className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  client360Tab === "billing"
                    ? "border-teal-600 text-teal-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>Payment & Invoices</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* ========================================================================= */}
              {/* TAB 1: OVERVIEW & DELIVERABLES */}
              {/* ========================================================================= */}
              {client360Tab === "overview" && (
                <div className="space-y-6">
                  {/* Deliverables Matrix */}
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
                        <div className="text-xs font-semibold text-slate-500 mt-1">Posts Planned</div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                        <div className="text-3xl font-black text-emerald-700">
                          {selectedClient.postsCompleted || 8}
                        </div>
                        <div className="text-xs font-semibold text-emerald-700 mt-1">Completed</div>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                        <div className="text-3xl font-black text-amber-700">
                          {Math.max((selectedClient.postsPlanned || 12) - (selectedClient.postsCompleted || 8), 0)}
                        </div>
                        <div className="text-xs font-semibold text-amber-700 mt-1">Pending</div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-center shadow-md shadow-emerald-600/20">
                        <div className="text-3xl font-black">
                          {selectedClient.postsPlanned > 0
                            ? Math.round(((selectedClient.postsCompleted || 8) / selectedClient.postsPlanned) * 100)
                            : 67}%
                        </div>
                        <div className="text-xs font-medium text-emerald-100 mt-1">Completion Rate</div>
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
                          <span className="text-slate-500">Billing Cadence:</span>
                          <span className="font-bold text-slate-700">{selectedClient.billingCycle || "MONTHLY"}</span>
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
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-indigo-600" />
                          <span>Assigned Goodwin Grow Pod</span>
                        </h4>
                        <button
                          onClick={() => {
                            const c = selectedClient;
                            setSelectedClient(null);
                            handleEditClick(c);
                          }}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Pod</span>
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              AM
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{selectedClient.accountManagerName || "Unassigned"}</div>
                              <div className="text-[10px] text-slate-400">Account Manager</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            selectedClient.accountManagerName
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {selectedClient.accountManagerName ? "Lead Contact" : "Not Assigned"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                              DS
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{selectedClient.leadDesignerName || "Unassigned"}</div>
                              <div className="text-[10px] text-slate-400">Lead Graphic & Video Designer</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            selectedClient.leadDesignerName
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {selectedClient.leadDesignerName ? "Creatives" : "Not Assigned"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                              CW
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{selectedClient.contentWriterName || "Unassigned"}</div>
                              <div className="text-[10px] text-slate-400">Copywriter & Reel Scriptwriter</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            selectedClient.contentWriterName
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {selectedClient.contentWriterName ? "Scripts" : "Not Assigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Quick Links */}
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
              )}

              {/* ========================================================================= */}
              {/* TAB: SECURE CLIENT LOGIN CREDENTIALS & VAULT */}
              {/* ========================================================================= */}
              {client360Tab === "credentials" && (
                selectedClient.confidentialAccess?.canAccessNotes === false ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                        AES-256 Vault Restricted
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        Client Credentials Restricted
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Access to client login credentials, ad accounts, and logins for{" "}
                        <strong className="text-slate-900">{selectedClient.name}</strong> is confidential. It is restricted to the assigned Account Manager{" "}
                        <strong className="text-amber-800 font-semibold">({selectedClient.accountManagerName || "Unassigned"})</strong>{" "}
                        and Super Admins. Cross-account access is strictly restricted.
                      </p>
                    </div>
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-xs border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Strict Data Confidentiality Enforced</span>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* Security Notice Banner */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                            Encrypted Client Login Credentials & Access Vault
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                            AES-256 Bit Encryption
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Restricted to <strong className="font-semibold">Super Admin</strong> and <strong className="font-semibold">Account Manager assigned to {selectedClient.name}</strong> ({selectedClient.accountManagerName || "Unassigned"}). Passwords and access tokens are encrypted at rest.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddCredModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Credential</span>
                    </button>
                  </div>

                  {/* Credentials List */}
                  {credentialsLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-slate-500 font-medium">Decrypting client vault records securely...</p>
                    </div>
                  ) : credentials.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <Key className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No Credentials Stored Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                        Securely store Meta Business Suite, Google Ads, CMS, Instagram, or hosting logins for {selectedClient.name}.
                      </p>
                      <button
                        onClick={() => setIsAddCredModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Login Credential</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {credentials.map((cred) => {
                        const isRevealed = !!revealedPasswords[cred.id];
                        const isCopied = copiedCredId === cred.id;
                        return (
                          <div
                            key={cred.id}
                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition space-y-3 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Key className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{cred.platform}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                                        {cred.accessLevel}
                                      </span>
                                      {cred.isVerified && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteCredential(cred.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete Credential"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-2 text-xs pt-3">
                                {/* Account ID / Username */}
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Username / Account ID</span>
                                    <span className="font-mono font-medium text-slate-800 text-xs truncate block">{cred.accountIdentifier}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPassword(cred.id + "-user", cred.accountIdentifier)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white transition cursor-pointer"
                                    title="Copy Username"
                                  >
                                    {copiedCredId === cred.id + "-user" ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {/* Password / Key */}
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Password / Secret Key</span>
                                    <span className="font-mono font-semibold text-slate-800 text-xs tracking-wider block">
                                      {isRevealed ? (cred.password || cred.decryptedPassword || cred.maskedPassword || "••••••••••••") : (cred.maskedPassword || "••••••••••••")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealPassword(cred.id)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white transition cursor-pointer"
                                      title={isRevealed ? "Hide password" : "Show password"}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassword(cred.id, cred.password || cred.decryptedPassword)}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white transition cursor-pointer"
                                      title="Copy Password"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Login URL */}
                                {cred.loginUrl && (
                                  <div className="flex items-center justify-between text-[11px] pt-1">
                                    <span className="text-slate-400">Login Portal:</span>
                                    <a
                                      href={cred.loginUrl.startsWith("http") ? cred.loginUrl : `https://${cred.loginUrl}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 hover:underline truncate max-w-[220px]"
                                    >
                                      <span>{cred.loginUrl.replace(/^https?:\/\//, "")}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  </div>
                                )}

                                {/* Recovery / 2FA Details */}
                                {cred.recoveryDetails && (
                                  <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-[11px] text-amber-900">
                                    <span className="font-semibold block text-[10px] text-amber-700 uppercase">2FA / Recovery:</span>
                                    <span>{cred.recoveryDetails}</span>
                                  </div>
                                )}

                                {/* Notes */}
                                {cred.notes && (
                                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="font-semibold block text-[10px] text-slate-400 uppercase">Notes:</span>
                                    <span>{cred.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Added by {cred.createdBy?.fullName || "Admin"}</span>
                              <span>{new Date(cred.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )
              )}

              {/* ========================================================================= */}
              {/* TAB 2: NOTES & RECORDS (SECURE CLIENT DATA MANAGEMENT) */}
              {/* ========================================================================= */}
              {client360Tab === "notes" && (
                selectedClient.confidentialAccess?.canAccessNotes === false ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs border border-indigo-200">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase tracking-wider">
                        Confidential Client Records
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        Notes Restricted to Assigned Account Manager
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Strategic notes, client requirements, meeting discussions, and follow-ups for{" "}
                        <strong className="text-slate-900">{selectedClient.name}</strong> can only be accessed or logged by assigned Account Manager{" "}
                        <strong className="text-indigo-800 font-semibold">({selectedClient.accountManagerName || "Unassigned"})</strong>{" "}
                        and Super Admins. Cross-account access is strictly restricted.
                      </p>
                    </div>
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-xs border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Confidential Client Record Policy Active</span>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* Security Notice Banner */}
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                            Confidential Client Notes & Strategic Records
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/80 text-indigo-900 border border-indigo-300">
                            Strict RBAC Enforced
                          </span>
                        </div>
                        <p className="text-xs text-indigo-700 mt-0.5">
                          Access is restricted to the <strong className="font-semibold">Super Admin</strong> and the <strong className="font-semibold">Account Manager assigned to {selectedClient.name}</strong> ({selectedClient.accountManagerName || "Unassigned"}).
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddNoteModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Note / Record</span>
                    </button>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      { key: "ALL", label: "All Notes", icon: BookOpen },
                      { key: "REQUIREMENT", label: "Requirements", icon: Tag },
                      { key: "MEETING_NOTE", label: "Meeting Notes", icon: MessageSquare },
                      { key: "STRATEGY", label: "Strategies & Roadmap", icon: Target },
                      { key: "FOLLOW_UP", label: "Follow-ups", icon: Clock },
                      { key: "IMPORTANT_INFO", label: "Important Info", icon: Pin },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const count = tab.key === "ALL" ? notes.length : notes.filter((n) => n.category === tab.key).length;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setNoteCategoryFilter(tab.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                            noteCategoryFilter === tab.key
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            noteCategoryFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Notes Feed */}
                  {notesLoading ? (
                    <div className="py-12 text-center text-slate-400">Loading confidential notes...</div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No notes found in this category</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Add client requirements, strategic decisions, call notes, or follow-up action items to keep the account organized securely.
                      </p>
                      <button
                        onClick={() => setIsAddNoteModalOpen(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                      >
                        Create First Record
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotes.map((note) => {
                        const categoryBadgeColor = {
                          REQUIREMENT: "bg-blue-50 text-blue-700 border-blue-200",
                          MEETING_NOTE: "bg-purple-50 text-purple-700 border-purple-200",
                          STRATEGY: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          FOLLOW_UP: "bg-amber-50 text-amber-700 border-amber-200",
                          IMPORTANT_INFO: "bg-rose-50 text-rose-700 border-rose-200",
                        }[note.category] || "bg-slate-50 text-slate-700 border-slate-200";

                        const categoryLabel = {
                          REQUIREMENT: "Client Requirement",
                          MEETING_NOTE: "Meeting Notes",
                          STRATEGY: "Strategy & Roadmap",
                          FOLLOW_UP: "Follow-up Action",
                          IMPORTANT_INFO: "Important Info",
                        }[note.category] || note.category;

                        return (
                          <div
                            key={note.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}>
                                    {categoryLabel}
                                  </span>
                                  {note.isConfidential && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Confidential</span>
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(note.createdAt).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">{note.title}</h4>
                              </div>

                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                              {note.content}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                  {note.createdBy?.fullName?.slice(0, 1) || "U"}
                                </div>
                                <span>Logged by <strong className="font-medium text-slate-600">{note.createdBy?.fullName || "Admin"}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )
              )}

              {/* ========================================================================= */}
              {/* TAB 3: PACKAGE & CONTRACT TERMS */}
              {/* ========================================================================= */}
              {client360Tab === "package" && (() => {
                const pkg = getPackageByName(selectedClient.activePackage);
                const monthlyFee = Number(selectedClient.monthlyRetainer || 0);
                const deliveryCost = Number(selectedClient.estimatedDeliveryCost || pkg?.estimatedDeliveryCost || Math.round(monthlyFee * 0.3));
                const profitInfo = calculatePackageProfitability(monthlyFee, deliveryCost);

                return (
                  <div className="space-y-6">
                    {/* Contract Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Monthly Retainer Fee
                        </div>
                        <div className="text-2xl font-black text-emerald-700 mt-1">
                          ₹{monthlyFee.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-slate-400"> /mo</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Billing: <strong className="text-slate-800">{selectedClient.billingCycle || "MONTHLY"}</strong>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Estimated Delivery Cost
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                          ₹{deliveryCost.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-slate-400"> /mo</span>
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          Gross Margin: {profitInfo.grossMarginPercent}% ({profitInfo.profitRating})
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Contract Status & Renewal
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                          <span className="text-lg">
                            {selectedClient.contractRenewalDate
                              ? new Date(selectedClient.contractRenewalDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                              : "No date set"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Started: {selectedClient.contractStartDate ? new Date(selectedClient.contractStartDate).toLocaleDateString("en-IN") : "Jan 2026"}
                        </div>
                      </div>
                    </div>

                    {/* Standardized Package Deliverables & Terms */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {selectedClient.activePackage}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Standardized Tier
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {pkg?.description || "Comprehensive marketing operating system contract."}
                          </p>
                        </div>
                      </div>

                      {pkg?.deliverables && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Contracted Deliverables Scope:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {pkg.deliverables.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-slate-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {pkg?.contractTerms && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-1">Standardized Contract Terms:</span>
                          <p>{pkg.contractTerms.summary}</p>
                        </div>
                      )}
                    </div>

                    {/* Active Add-On Services */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Optional Add-On Services</span>
                      </h4>

                      {Array.isArray(selectedClient.addOnServices) && selectedClient.addOnServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {selectedClient.addOnServices.map((addon: any, idx: number) => {
                            const name = typeof addon === "string" ? addon : addon.name;
                            const price = typeof addon === "object" ? addon.price : null;
                            return (
                              <div key={idx} className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                                <span className="font-semibold text-purple-950">{name}</span>
                                {price && <span className="font-bold text-purple-700">₹{price.toLocaleString("en-IN")}</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No optional add-ons selected for this client.</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* TAB 4: PAYMENT & INVOICES */}
              {/* ========================================================================= */}
              {client360Tab === "billing" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Retainer Billing & Payment Register</h3>
                      <p className="text-xs text-slate-500">Track invoices, settlement dates, and overdue payments</p>
                    </div>
                    <a
                      href={`/app/invoices?clientId=${selectedClient.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
                    >
                      Generate New Invoice
                    </a>
                  </div>

                  {Array.isArray(selectedClient.invoices) && selectedClient.invoices.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="p-3">Invoice Number</th>
                            <th className="p-3">Issue Date</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Total Amount</th>
                            <th className="p-3">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedClient.invoices.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-slate-50/60">
                              <td className="p-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                              <td className="p-3 text-slate-600">{new Date(inv.issueDate).toLocaleDateString("en-IN")}</td>
                              <td className="p-3 text-slate-600">{new Date(inv.dueDate).toLocaleDateString("en-IN")}</td>
                              <td className="p-3 font-bold text-slate-900">₹{Number(inv.totalAmount).toLocaleString("en-IN")}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === "PAID"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : inv.status === "OVERDUE"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                      No invoices recorded for this client yet.
                    </div>
                  )}
                </div>
              )}
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
                Edit Client & Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT CLIENT MODAL (WITH STANDARDIZED PACKAGES, ADD-ONS & RBAC) */}
      {/* ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingClient ? `Edit ${editingClient.name}` : "Onboard New Agency Client"}
                </h3>
                <p className="text-xs text-slate-500">
                  Standardized packages, pricing, contract terms, pod assignments, and delivery costs.
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Section 1: Business Identity */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Client & Brand Identity</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Legal Name *</label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Brand Name</label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="e.g. Sapna Detailing & Car Spa"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Industry / Category</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g. Automotive Detailing & Care"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98930 11223"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@company.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Service Packages & Pricing */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Service Package & Pricing Strategy</span>
                  </h4>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.customPricing}
                      onChange={(e) => setFormData({ ...formData, customPricing: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Custom Pricing Override</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Service Package *</label>
                    <select
                      value={formData.activePackage}
                      onChange={(e) => handlePackageSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                    >
                      <optgroup label="Core Retainer Packages (5 Standard Tiers)">
                        {SERVICE_PACKAGES.filter((p) => p.category === "CORE_RETAINER").map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} — ₹{p.price.toLocaleString("en-IN")}/mo
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Specialized Retainers & New Demand-Driven Tiers">
                        {SERVICE_PACKAGES.filter((p) => p.category !== "CORE_RETAINER").map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} — ₹{p.price.toLocaleString("en-IN")} {p.cadence}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Retainer (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formData.monthlyRetainer}
                      onChange={(e) => setFormData({ ...formData, monthlyRetainer: e.target.value })}
                      placeholder="50000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency</label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="MONTHLY">Monthly Advance</option>
                      <option value="QUARTERLY">Quarterly (3 Months)</option>
                      <option value="SEMI_ANNUAL">Semi-Annual (6 Months)</option>
                      <option value="ANNUAL">Annual Contract (12 Months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Delivery Cost (₹)</label>
                    <input
                      type="number"
                      value={formData.estimatedDeliveryCost}
                      onChange={(e) => setFormData({ ...formData, estimatedDeliveryCost: e.target.value })}
                      placeholder="15000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Planned Posts</label>
                    <input
                      type="number"
                      value={formData.postsPlanned}
                      onChange={(e) => setFormData({ ...formData, postsPlanned: e.target.value })}
                      placeholder="12"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Live Unit Economics Preview */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Unit Economics:</span>
                    <span className="text-slate-500">
                      Margin: <strong className="text-emerald-700">{formProfit.grossMarginPercent}%</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      Net Profit: <strong className="text-slate-900">₹{formProfit.netProfit.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    formProfit.grossMarginPercent >= 65 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {formProfit.profitRating} MARGIN
                  </span>
                </div>
              </div>

              {/* Section 3: Contract Dates & Status */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Contract Terms & Renewal Dates</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Start Date</label>
                    <input
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal / Review Date</label>
                    <input
                      type="date"
                      value={formData.contractRenewalDate}
                      onChange={(e) => setFormData({ ...formData, contractRenewalDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Lifecycle Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ONBOARDING">ONBOARDING</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="CHURNED">CHURNED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Optional Add-on Services */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>4. Optional Add-On Services</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ADD_ON_SERVICES.map((addon) => {
                    const isSelected = formData.addOnServices.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-purple-50/80 border-purple-300 text-purple-950"
                            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by div onClick
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs">{addon.name}</span>
                            <span className="font-bold text-purple-700">₹{addon.price.toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{addon.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Team Pod Assignment */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>5. Assigned Team Pod (Real Workspace Members)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designated Account Manager *
                    </label>
                    <select
                      value={formData.accountManagerName}
                      onChange={(e) => {
                        const selectedMember = teamMembers.find((m) => m.fullName === e.target.value);
                        setFormData({
                          ...formData,
                          accountManagerName: e.target.value,
                          accountManagerId: selectedMember?.id || "",
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                    >
                      <option value="">-- Select Real Account Manager --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName} ({m.primaryRole || "Team"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Creative Designer</label>
                    <select
                      value={formData.leadDesignerName}
                      onChange={(e) => setFormData({ ...formData, leadDesignerName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="">-- Unassigned --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Copywriter / Scriptwriter</label>
                    <select
                      value={formData.contentWriterName}
                      onChange={(e) => setFormData({ ...formData, contentWriterName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="">-- Unassigned --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Media Buyer (Paid Ads)</label>
                    <select
                      value={formData.mediaBuyerName}
                      onChange={(e) => setFormData({ ...formData, mediaBuyerName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="">-- Unassigned --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Guidelines & Strategic Notes</label>
                <textarea
                  rows={2}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  {editingClient ? "Save Changes" : "Create Client Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CONFIDENTIAL CLIENT NOTE MODAL */}
      {/* ========================================================================= */}
      {isAddNoteModalOpen && selectedClient && selectedClient.confidentialAccess?.canAccessNotes !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Add Confidential Note / Record</h3>
                  <p className="text-[11px] text-indigo-300">For {selectedClient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Record Category *</label>
                <select
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold"
                >
                  <option value="REQUIREMENT">Client Requirement & Scope</option>
                  <option value="MEETING_NOTE">Meeting Notes & Discussion</option>
                  <option value="STRATEGY">Marketing Strategy & Roadmap</option>
                  <option value="FOLLOW_UP">Follow-Up Action Item</option>
                  <option value="IMPORTANT_INFO">Important Confidential Info</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Q4 Brand Expansion Review & UAE Roadmap"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note & Record Content *</label>
                <textarea
                  rows={5}
                  required
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Enter detailed discussion points, technical scope, customer expectations, deliverables deadlines, or strategic decisions..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="confidential-check"
                  checked={noteForm.isConfidential}
                  onChange={(e) => setNoteForm({ ...noteForm, isConfidential: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="confidential-check" className="text-xs text-slate-700 cursor-pointer">
                  Strictly Confidential (Restricted to Super Admin & Assigned AM)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save Confidential Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CLIENT LOGIN CREDENTIAL MODAL (ENCRYPTED STORAGE) */}
      {/* ========================================================================= */}
      {isAddCredModalOpen && selectedClient && selectedClient.confidentialAccess?.canAccessNotes !== false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Login Credential</h3>
                  <p className="text-xs text-slate-500">
                    Encrypted storage for <strong className="text-slate-800">{selectedClient.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCredModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform / Service *</label>
                <select
                  required
                  value={credForm.platform}
                  onChange={(e) => setCredForm({ ...credForm, platform: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-semibold"
                >
                  <option value="Meta Business Suite">Meta Business Suite / Facebook Ads</option>
                  <option value="Google Ads / MCC">Google Ads / MCC Account</option>
                  <option value="Google Analytics 4">Google Analytics 4 (GA4)</option>
                  <option value="Google Tag Manager">Google Tag Manager (GTM)</option>
                  <option value="Instagram Business">Instagram Business Account</option>
                  <option value="Shopify Admin">Shopify Store Admin</option>
                  <option value="WordPress / CMS">WordPress / Website CMS Admin</option>
                  <option value="Web Hosting / CPanel">Hosting / CPanel / DNS Server</option>
                  <option value="LinkedIn Campaign Manager">LinkedIn Campaign Manager</option>
                  <option value="WhatsApp Business API">WhatsApp Business API</option>
                  <option value="Custom / Other">Custom / Other Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Identifier / Username / Email *</label>
                <input
                  type="text"
                  required
                  value={credForm.accountIdentifier}
                  onChange={(e) => setCredForm({ ...credForm, accountIdentifier: e.target.value })}
                  placeholder="e.g. ads@brand.com or ACT-928174921"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password / API Key / Access Token *</label>
                <input
                  type="text"
                  required
                  value={credForm.password}
                  onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                  placeholder="Enter password or secret token (encrypted via AES-256)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login URL / Portal</label>
                  <input
                    type="text"
                    value={credForm.loginUrl}
                    onChange={(e) => setCredForm({ ...credForm, loginUrl: e.target.value })}
                    placeholder="https://business.facebook.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Access Level</label>
                  <select
                    value={credForm.accessLevel}
                    onChange={(e) => setCredForm({ ...credForm, accessLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
                  >
                    <option value="ADMIN">Administrator / Full Access</option>
                    <option value="EDITOR">Standard / Editor Access</option>
                    <option value="VIEWER">Read / Viewer Only</option>
                    <option value="AGENCY_PARTNER">Agency Partner Delegation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">2FA & Recovery Instructions (Optional)</label>
                <input
                  type="text"
                  value={credForm.recoveryDetails}
                  onChange={(e) => setCredForm({ ...credForm, recoveryDetails: e.target.value })}
                  placeholder="e.g. 2FA sent to client CEO WhatsApp +91-98... or Backup OTPs in Vault"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Instructions / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={credForm.notes}
                  onChange={(e) => setCredForm({ ...credForm, notes: e.target.value })}
                  placeholder="e.g. Do not modify pixel settings. Use Ad Account #3 for campaigns."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  This credential will be encrypted with AES-256 and restricted to Super Admin & assigned Account Manager.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCredModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCred}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingCred ? "Encrypting & Saving..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
