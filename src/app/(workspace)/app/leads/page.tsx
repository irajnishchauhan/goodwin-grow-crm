"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  X,
  ArrowRight,
  Download,
  Upload,
  Filter,
  FileSpreadsheet,
  Edit2,
  Trash2,
  User,
  Save,
  AlertTriangle,
  Clock,
  IndianRupee,
  Activity as ActivityIcon,
  Calendar,
  Layers,
  ChevronRight,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const serviceOptions = [
  "Dealer Network Stocking & Distribution",
  "Lithium E-Rickshaw & 3W Fleet Supply",
  "Tall Tubular Inverter & Solar Distribution",
  "Automotive Silver-Alloy Starter Batteries",
  "Commercial Fleet Battery Bulk Contract",
  "Full Stack Growth Marketing Retainer",
  "Ceramic Detailing SEO & Meta Ads",
  "Luxury Furnishing Omnichannel Brand Campaign",
  "Performance Ads & Meta Funnels",
  "Social Media Content & Reels Retainer",
  "SEO & Google Business Profile Optimization",
  "High-Converting Landing Page & WhatsApp Bot",
];

const lostReasonOptions = [
  "Competitor chosen (pricing)",
  "Competitor chosen (features/offer)",
  "Budget constraints / price objection",
  "Postponed / paused marketing expansion",
  "Decided to build in-house",
  "Unresponsive / ghosted after proposal",
  "Mismatch in agency service scope",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assignedOwnerFilter, setAssignedOwnerFilter] = useState("ALL");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Create Lead Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Website Inbound");
  const [serviceRequired, setServiceRequired] = useState("");
  const [dealValue, setDealValue] = useState<number | string>(150000);
  const [nextFollowUp, setNextFollowUp] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [priority, setPriority] = useState("MEDIUM");
  const [score, setScore] = useState(65);
  const [assignedOwnerId, setAssignedOwnerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Edit Lead Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("NEW");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editScore, setEditScore] = useState(50);
  const [editSource, setEditSource] = useState("");
  const [editServiceRequired, setEditServiceRequired] = useState("");
  const [editDealValue, setEditDealValue] = useState<number | string>(0);
  const [editNextFollowUp, setEditNextFollowUp] = useState("");
  const [editLostReason, setEditLostReason] = useState("");
  const [editAssignedOwnerId, setEditAssignedOwnerId] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Lead Detail & Activity History Slideover / Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeLeadDetail, setActiveLeadDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Convert Lead Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [convertDealTitle, setConvertDealTitle] = useState("");
  const [convertDealValue, setConvertDealValue] = useState(100000);
  const [converting, setConverting] = useState(false);

  // CSV Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchTeam();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, priorityFilter, assignedOwnerFilter]);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load team members", err);
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

  async function fetchLeads() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (assignedOwnerFilter !== "ALL") params.set("assignedOwnerId", assignedOwnerFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setDuplicateWarning(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          companyName: companyName || null,
          email: email || null,
          phone: phone || null,
          source,
          serviceRequired: serviceRequired || null,
          dealValue: dealValue ? Number(dealValue) : null,
          nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
          priority,
          score,
          tags,
          assignedOwnerId: assignedOwnerId || null,
          clientId: clientId || null,
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.isDuplicate) {
        setDuplicateWarning(data.error || "Duplicate lead detected: A lead with this email or phone number already exists.");
        setCreating(false);
        return;
      }

      if (data.success) {
        setCreateModalOpen(false);
        resetCreateForm();
        fetchLeads();
      } else {
        alert(data.error || "Failed to create lead");
      }
    } catch (err: any) {
      alert("Error creating lead");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setSource("Website Inbound");
    setServiceRequired("");
    setDealValue(150000);
    setNextFollowUp(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setPriority("MEDIUM");
    setScore(65);
    setAssignedOwnerId("");
    setClientId("");
    setTagsInput("");
    setDuplicateWarning(null);
  }

  async function openLeadDetail(leadId: string) {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (data.success) {
        setActiveLeadDetail(data.data);
      } else {
        alert(data.error || "Failed to load lead details");
        setDetailModalOpen(false);
      }
    } catch {
      alert("Error fetching lead history");
      setDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  function openEdit(lead: any) {
    setEditingLead(lead);
    setEditFirstName(lead.firstName);
    setEditLastName(lead.lastName);
    setEditCompanyName(lead.companyName || "");
    setEditEmail(lead.email || "");
    setEditPhone(lead.phone || "");
    setEditStatus(lead.status);
    setEditPriority(lead.priority);
    setEditScore(lead.score || 50);
    setEditSource(lead.source || "");
    setEditServiceRequired(lead.serviceRequired || "");
    setEditDealValue(lead.dealValue || 0);
    setEditNextFollowUp(
      lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0, 16) : ""
    );
    setEditLostReason(lead.lostReason || "");
    setEditAssignedOwnerId(lead.assignedOwnerId || "");
    setEditClientId(lead.clientId || "");
    setEditTagsInput(Array.isArray(lead.tags) ? lead.tags.join(", ") : "");
    setEditModalOpen(true);
  }

  async function handleUpdateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;
    setSavingEdit(true);

    try {
      const tags = editTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          companyName: editCompanyName || null,
          email: editEmail || null,
          phone: editPhone || null,
          status: editStatus,
          priority: editPriority,
          score: Number(editScore) || 0,
          tags,
          source: editSource,
          serviceRequired: editServiceRequired || null,
          dealValue: editDealValue ? Number(editDealValue) : null,
          nextFollowUp: editNextFollowUp ? new Date(editNextFollowUp) : null,
          lostReason: editStatus === "LOST" ? editLostReason : null,
          assignedOwnerId: editAssignedOwnerId || null,
          clientId: editClientId || null,
          convertToDeal: editStatus === "CONVERTED" && editingLead.status !== "CONVERTED",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingLead(null);
        fetchLeads();
      } else {
        alert(data.error || "Failed to update lead");
      }
    } catch {
      alert("Error updating lead");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteLead(leadId: string, leadName: string) {
    if (!confirm(`Are you sure you want to permanently delete lead "${leadName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        if (editingLead && editingLead.id === leadId) {
          setEditModalOpen(false);
          setEditingLead(null);
        }
        if (activeLeadDetail && activeLeadDetail.id === leadId) {
          setDetailModalOpen(false);
          setActiveLeadDetail(null);
        }
        fetchLeads();
      } else {
        alert(data.error || "Failed to delete lead (Insufficient permissions / RBAC)");
      }
    } catch {
      alert("Error deleting lead");
    }
  }

  function openConvert(lead: any) {
    setSelectedLead(lead);
    setConvertDealTitle(`${lead.companyName || `${lead.firstName} ${lead.lastName}`} - ${lead.serviceRequired || "Deal"}`);
    setConvertDealValue(lead.dealValue || 100000);
    setConvertModalOpen(true);
  }

  async function handleConvertToClient(lead: any) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONVERTED",
          convertToDeal: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch {
      alert("Error converting lead");
    }
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONVERTED",
          convertToDeal: true,
          dealTitle: convertDealTitle,
          dealValue: convertDealValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConvertModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch {
      alert("Error converting lead");
    } finally {
      setConverting(false);
    }
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importRawText.trim()) return;

    setImporting(true);
    setImportResult(null);

    try {
      const lines = importRawText.trim().split("\n");
      const rowsToImport = lines.slice(1).map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          firstName: parts[0] || "Prospect",
          lastName: parts[1] || "Lead",
          companyName: parts[2] || null,
          email: parts[3] || null,
          phone: parts[4] || null,
          source: parts[5] || "CSV Import",
          serviceRequired: parts[6] || serviceOptions[0],
          dealValue: Number(parts[7]) || 100000,
          priority: parts[8] || "MEDIUM",
          score: Number(parts[9]) || 60,
        };
      });

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: rowsToImport }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult(data.data);
        fetchLeads();
      } else {
        alert(data.error || "Failed to import leads");
      }
    } catch {
      alert("Error processing import");
    } finally {
      setImporting(false);
    }
  }

  function exportCSV() {
    if (leads.length === 0) return;
    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (/^[=+\-@]/.test(str)) str = `'${str}`;
      return `"${str.replace(/"/g, '""')}"`;
    };
    const headers = [
      "First Name",
      "Last Name",
      "Company",
      "Email",
      "Phone",
      "Source",
      "Service Required",
      "Deal Value (INR)",
      "Owner",
      "Status",
      "Priority",
      "Next Follow-Up",
      "Lost Reason",
    ];
    const rows = leads.map((l) => [
      escapeCell(l.firstName),
      escapeCell(l.lastName),
      escapeCell(l.companyName || ""),
      escapeCell(l.email || ""),
      escapeCell(l.phone || ""),
      escapeCell(l.source || ""),
      escapeCell(l.serviceRequired || ""),
      escapeCell(l.dealValue || 0),
      escapeCell(l.assignedOwner?.fullName || "Unassigned"),
      escapeCell(l.status),
      escapeCell(l.priority),
      escapeCell(l.nextFollowUp ? new Date(l.nextFollowUp).toISOString() : ""),
      escapeCell(l.lostReason || ""),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.map(escapeCell).join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goodwin_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const now = new Date();

  const filteredLeads = leads.filter(
    (l) =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (l.companyName && l.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.serviceRequired && l.serviceRequired.toLowerCase().includes(search.toLowerCase())) ||
      (l.source && l.source.toLowerCase().includes(search.toLowerCase()))
  );

  const overdueFollowUps = leads.filter(
    (l) => l.nextFollowUp && new Date(l.nextFollowUp) < now && !["CONVERTED", "LOST"].includes(l.status)
  );

  const isAllLeadsSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedLeadIds.includes(l.id));

  function handleSelectAllLeads() {
    if (isAllLeadsSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  }

  function handleToggleLead(id: string) {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleBulkDeleteLeads() {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${selectedLeadIds.length} selected leads?`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedLeadIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLeadIds([]);
        fetchLeads();
      } else {
        alert(data.error || "Failed to delete selected leads");
      }
    } catch {
      alert("Error deleting leads");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleBulkUpdateLeadStatus(newStatus: string) {
    if (selectedLeadIds.length === 0) return;
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedLeadIds, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLeadIds([]);
        fetchLeads();
      } else {
        alert(data.error || "Failed to update selected leads");
      }
    } catch {
      alert("Error updating leads");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agency Leads & Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Goodwin OS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track prospect source, requested agency service, deal value, account owner, follow-ups, and activity history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {overdueFollowUps.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{overdueFollowUps.length} Overdue Follow-up{overdueFollowUps.length > 1 ? "s" : ""}</span>
            </div>
          )}

          <button
            onClick={() => {
              setImportRawText("First Name,Last Name,Company,Email,Phone,Source,Service Required,Deal Value,Priority,Score\nNikhil,Sharma,Nexus Auto Detailing,nikhil@nexusauto.com,+91 98777 66554,Inbound,Ceramic Detailing SEO & Meta Ads,180000,HIGH,80\nPreeti,Iyer,Iyer Living Furnishings,preeti@iyerliving.com,+91 98888 77665,Meta Ads,Luxury Furnishing Omnichannel Brand Campaign,250000,URGENT,90");
              setImportResult(null);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, company, service, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Owner:</span>
          </div>
          <select
            value={assignedOwnerFilter}
            onChange={(e) => setAssignedOwnerFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Owners</option>
            <option value="me">Assigned to Me</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold ml-2">
            <span>Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Bulk Action Bar */}
        {selectedLeadIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950">
                {selectedLeadIds.length} of {filteredLeads.length} leads selected
              </span>
              <button
                onClick={handleSelectAllLeads}
                className="underline text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer ml-1"
              >
                {isAllLeadsSelected ? "Deselect All" : "Select All Visible"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateLeadStatus(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer shadow-2xs"
                defaultValue=""
              >
                <option value="" disabled>Change Status...</option>
                <option value="NEW">Set NEW</option>
                <option value="CONTACTED">Set CONTACTED</option>
                <option value="QUALIFIED">Set QUALIFIED</option>
                <option value="PROPOSAL">Set PROPOSAL</option>
                <option value="CONVERTED">Set CONVERTED</option>
                <option value="LOST">Set LOST</option>
              </select>

              <button
                onClick={handleBulkDeleteLeads}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete ({selectedLeadIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedLeadIds([])}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                {/* SELECT ALL AT ONCE CHECKBOX */}
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={handleSelectAllLeads}
                    title={isAllLeadsSelected ? "Deselect All" : "Select All Leads"}
                    className="flex items-center justify-center text-slate-500 hover:text-emerald-600 cursor-pointer"
                  >
                    {isAllLeadsSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : selectedLeadIds.length > 0 ? (
                      <div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-800 font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Lead & Company</th>
                <th className="py-3.5 px-3">Service Required</th>
                <th className="py-3.5 px-3">Deal Value</th>
                <th className="py-3.5 px-3">Source</th>
                <th className="py-3.5 px-3">Owner</th>
                <th className="py-3.5 px-3">Next Follow-Up</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading agency leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No leads match the filters. Click "Create New Lead" to add a prospective client.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const isFollowUpOverdue = Boolean(
                    lead.nextFollowUp &&
                      new Date(lead.nextFollowUp) < now &&
                      !["CONVERTED", "LOST"].includes(lead.status)
                  );

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/60 transition group ${
                        isSelected ? "bg-emerald-50/50" : isFollowUpOverdue ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleLead(lead.id)}
                          className="flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      {/* Name & Company */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => openLeadDetail(lead.id)}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-left transition flex items-center gap-1 group/btn"
                        >
                          <span>{lead.firstName} {lead.lastName}</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover/btn:text-emerald-600 group-hover/btn:translate-x-0.5 transition" />
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          {lead.companyName && (
                            <span className="font-medium text-slate-700 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {lead.companyName}
                            </span>
                          )}
                          {lead.email && (
                            <span className="text-slate-400 truncate max-w-[150px]">
                              • {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service Required */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                          {lead.serviceRequired || "Full Stack Marketing"}
                        </div>
                        {lead.client && (
                          <div className="text-[10px] text-emerald-700 font-bold truncate">
                            Linked: {lead.client.name}
                          </div>
                        )}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString("en-IN")}` : "—"}
                        </div>
                        <div className="text-[10px] text-slate-400">Retainer / Deal</div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {lead.source || "Inbound"}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{lead.assignedOwner?.fullName || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* Next Follow-Up */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {lead.nextFollowUp ? (
                          <div className={isFollowUpOverdue ? "text-amber-700 font-bold" : "text-slate-600"}>
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(lead.nextFollowUp)}</span>
                            </div>
                            {isFollowUpOverdue && (
                              <span className="inline-block text-[9px] font-black text-amber-700 bg-amber-100 px-1 rounded">
                                Overdue Follow-up
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status & Lost Reason */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            lead.status === "QUALIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : lead.status === "NEW"
                              ? "bg-blue-100 text-blue-800"
                              : lead.status === "CONVERTED"
                              ? "bg-teal-100 text-teal-800"
                              : lead.status === "LOST"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {lead.status}
                        </span>

                        {lead.status === "LOST" && lead.lostReason && (
                          <div className="text-[10px] text-rose-700 font-medium max-w-[130px] truncate mt-0.5" title={lead.lostReason}>
                            Reason: {lead.lostReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openLeadDetail(lead.id)}
                            title="View Activity History"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-700 cursor-pointer"
                          >
                            <ActivityIcon className="w-3.5 h-3.5" />
                          </button>

                          {lead.status !== "CONVERTED" && (
                            <button
                              onClick={() => openConvert(lead)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] transition cursor-pointer"
                            >
                              Convert
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(lead)}
                            title="Edit Lead"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id, `${lead.firstName} ${lead.lastName}`)}
                            title="Delete Lead"
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Lead Detail & Activity History Slideover / Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    {activeLeadDetail ? activeLeadDetail.firstName.charAt(0) : "L"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {activeLeadDetail ? `${activeLeadDetail.firstName} ${activeLeadDetail.lastName}` : "Lead History"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeLeadDetail?.companyName || "Independent Prospect"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setActiveLeadDetail(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail || !activeLeadDetail ? (
                <div className="p-12 text-center text-slate-400">Loading lead activity timeline...</div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Lead Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Service Required:</span>
                        <span className="font-bold text-slate-900">{activeLeadDetail.serviceRequired || "General Retainer"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Deal Value:</span>
                        <span className="font-bold text-emerald-700">
                          {activeLeadDetail.dealValue ? `₹${Number(activeLeadDetail.dealValue).toLocaleString("en-IN")}` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Account Owner:</span>
                        <span className="font-semibold text-slate-800">{activeLeadDetail.assignedOwner?.fullName || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Lead Source:</span>
                        <span className="font-semibold text-slate-800">{activeLeadDetail.source || "Inbound"}</span>
                      </div>
                    </div>

                    {activeLeadDetail.status === "LOST" && activeLeadDetail.lostReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                        <span className="font-bold block">Lost Reason:</span>
                        <span>{activeLeadDetail.lostReason}</span>
                      </div>
                    )}

                    {activeLeadDetail.nextFollowUp && (
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Next Follow-Up:</span>
                        </span>
                        <span className="font-bold text-slate-900">{formatDate(activeLeadDetail.nextFollowUp)}</span>
                      </div>
                    )}
                  </div>

                  {/* Activity History Timeline */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <ActivityIcon className="w-4 h-4 text-emerald-600" />
                      <span>Activity History & Audit Log ({activeLeadDetail.activities?.length || 0})</span>
                    </h3>

                    {(!activeLeadDetail.activities || activeLeadDetail.activities.length === 0) ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No activity recorded yet for this lead. Changes to status and follow-ups will log here automatically.
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-4 py-2">
                        {activeLeadDetail.activities.map((act: any) => (
                          <div key={act.id} className="relative group">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                              <span>{act.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {formatDate(act.occurredAt || act.createdAt)}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                {act.description}
                              </p>
                            )}
                            {act.performedBy && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Performed by: {act.performedBy.fullName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => {
                  if (activeLeadDetail) openEdit(activeLeadDetail);
                  setDetailModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit Lead Info
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add New Prospect Lead</h2>
                <p className="text-xs text-slate-500">Includes duplicate detection and service requirements.</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate Warning Banner */}
            {duplicateWarning && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-950">Duplicate Lead Prevention</h4>
                  <p className="text-[11px] text-rose-800 mt-0.5">{duplicateWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Detailing Studios"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prospect@brand.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Required (Combobox + Choice to Add) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Service Required <span className="text-slate-400 font-normal">(type custom or select suggestion)</span> *
                  </label>
                  {serviceRequired && (
                    <button
                      type="button"
                      onClick={() => setServiceRequired("")}
                      className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  list="serviceOptionsList"
                  required
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  placeholder="e.g. AI Automation, Meta Performance Ads, Custom..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold text-slate-800"
                />
                <datalist id="serviceOptionsList">
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>

                {/* Popular Quick Suggestions */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {serviceOptions.slice(0, 6).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setServiceRequired(opt)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        serviceRequired === opt
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹ INR)</label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up</label>
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Website, Referral, Instagram"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Account Owner</label>
                  <select
                    value={assignedOwnerId}
                    onChange={(e) => setAssignedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">Leave Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Client Workspace</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">None (New Standalone Prospect)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. inbound, priority, retainer"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {creating && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Lead Record</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Lost Reason - displayed conditionally if status is LOST */}
              {editStatus === "LOST" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    Lost Reason (Required for Lost Pipeline Insights)
                  </label>
                  <select
                    value={editLostReason}
                    onChange={(e) => setEditLostReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none font-medium text-rose-950"
                  >
                    <option value="">Select lost reason</option>
                    {lostReasonOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service Required (Combobox + Choice to Add) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Service Required <span className="text-slate-400 font-normal">(type custom or select suggestion)</span>
                  </label>
                  {editServiceRequired && (
                    <button
                      type="button"
                      onClick={() => setEditServiceRequired("")}
                      className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  list="editServiceOptionsList"
                  value={editServiceRequired}
                  onChange={(e) => setEditServiceRequired(e.target.value)}
                  placeholder="e.g. AI Automation, Meta Performance Ads, Custom..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold text-slate-800"
                />
                <datalist id="editServiceOptionsList">
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>

                {/* Popular Quick Suggestions */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {serviceOptions.slice(0, 6).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEditServiceRequired(opt)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        editServiceRequired === opt
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹ INR)</label>
                  <input
                    type="number"
                    value={editDealValue}
                    onChange={(e) => setEditDealValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Next Follow-Up</label>
                  <input
                    type="datetime-local"
                    value={editNextFollowUp}
                    onChange={(e) => setEditNextFollowUp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Owner</label>
                  <select
                    value={editAssignedOwnerId}
                    onChange={(e) => setEditAssignedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">Leave Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="inbound, vip"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Workspace</label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">None</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteLead(editingLead.id, `${editingLead.firstName} ${editingLead.lastName}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Lead</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {convertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Convert Lead to Deal & Account</h2>
              <button
                onClick={() => setConvertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={convertDealTitle}
                  onChange={(e) => setConvertDealTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value (₹ INR)</label>
                <input
                  type="number"
                  required
                  value={convertDealValue}
                  onChange={(e) => setConvertDealValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-emerald-700"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                Converting this lead creates an enrolled Client Account, Contact, and Deal in the Goodwin Grow CRM pipeline.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {converting ? "Converting..." : "Complete Conversion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Bulk CSV Lead Ingestion</h2>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Raw CSV Records (Header Row Required)
                </label>
                <textarea
                  rows={6}
                  required
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  className="w-full font-mono text-[11px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                ></textarea>
              </div>

              {importResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Import Completed</span>
                  </div>
                  <div>• Successfully Created: {importResult.count} leads</div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {importing ? "Importing..." : "Process Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
