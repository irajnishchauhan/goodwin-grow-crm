"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Users,
  Shield,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Plus,
  X,
  CheckCircle2,
  Copy,
  Edit2,
  Trash2,
  Eye,
  Search,
  Check,
  AlertCircle,
  Briefcase,
  Layers,
  Save,
  UserCheck,
  UserX,
  Upload,
  Image as ImageIcon,
  Key,
  Lock,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "roles" ? "roles" : searchParams.get("tab") === "org" ? "organization" : "team";

  const [activeTab, setActiveTab] = useState<"team" | "roles" | "organization">(initialTab);
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------------------
  // 1. Team State
  // ----------------------------------------------------------------------
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [searchMember, setSearchMember] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("ALL");

  // Add / Invite Member Modal
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberRoleId, setNewMemberRoleId] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("Goodwin@2026!");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; fullName: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Edit Member Modal
  const [editMemberModal, setEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberRoleId, setEditMemberRoleId] = useState("");
  const [editMemberStatus, setEditMemberStatus] = useState("ACTIVE");
  const [editMemberPassword, setEditMemberPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // Quick Reset Password Modal
  const [resetPwdModal, setResetPwdModal] = useState(false);
  const [resetPwdMember, setResetPwdMember] = useState<any | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState("Goodwin@2026!");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [resetPwdSuccess, setResetPwdSuccess] = useState<string | null>(null);

  // View Member Details Modal
  const [viewMemberModal, setViewMemberModal] = useState(false);
  const [viewingMember, setViewingMember] = useState<any | null>(null);

  // ----------------------------------------------------------------------
  // 2. Roles State
  // ----------------------------------------------------------------------
  const [roles, setRoles] = useState<any[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

  // Create Role Modal
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Edit Role Modal
  const [editRoleModal, setEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [editRolePermissions, setEditRolePermissions] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  // View Role Modal
  const [viewRoleModal, setViewRoleModal] = useState(false);
  const [viewingRole, setViewingRole] = useState<any | null>(null);

  // ----------------------------------------------------------------------
  // 3. Organization Settings State
  // ----------------------------------------------------------------------
  const [orgForm, setOrgForm] = useState({
    name: "",
    code: "",
    status: "ACTIVE",
    logoUrl: "",
    businessEmail: "",
    phone: "",
    website: "",
    address: "",
    country: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    seatLimit: 10,
  });
  const [savingOrg, setSavingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [orgMessage, setOrgMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([fetchSession(), fetchTeam(), fetchRoles(), fetchOrgSettings()]);
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setOrgMessage({ type: "error", text: "Please upload an image file (PNG, JPG, SVG, WebP)" });
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 320;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/png", 0.9);
          setOrgForm((prev) => ({ ...prev, logoUrl: dataUrl }));
          setOrgMessage({ type: "success", text: "Logo loaded! Click 'Save Changes' to update across all workspace data." });
        }
        setUploadingLogo(false);
      };
      img.onerror = () => {
        setOrgMessage({ type: "error", text: "Failed to read image file" });
        setUploadingLogo(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setOrgMessage({ type: "error", text: "Failed to load image file" });
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  }

  async function fetchOrgSettings() {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setOrgForm({
          name: data.data.name || "",
          code: data.data.code || "",
          status: data.data.status || "ACTIVE",
          logoUrl: data.data.logoUrl || "",
          businessEmail: data.data.businessEmail || "",
          phone: data.data.phone || "",
          website: data.data.website || "",
          address: data.data.address || "",
          country: data.data.country || "",
          currency: data.data.currency || "INR",
          timezone: data.data.timezone || "Asia/Kolkata",
          seatLimit: data.data.seatLimit || 10,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveOrgSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingOrg(true);
    setOrgMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgForm.name,
          logoUrl: orgForm.logoUrl,
          businessEmail: orgForm.businessEmail,
          phone: orgForm.phone,
          website: orgForm.website,
          address: orgForm.address,
          country: orgForm.country,
          currency: orgForm.currency,
          timezone: orgForm.timezone,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setOrgMessage({ type: "success", text: resData.message || "Organization profile updated!" });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("workspace-logo-updated", {
              detail: { logoUrl: orgForm.logoUrl, tenantCode: orgForm.code },
            })
          );
        }
        await fetchSession();
      } else {
        setOrgMessage({ type: "error", text: resData.error || "Failed to update organization settings" });
      }
    } catch (err: any) {
      setOrgMessage({ type: "error", text: err.message || "Error saving organization profile" });
    } finally {
      setSavingOrg(false);
    }
  }

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setSessionData(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch("/api/roles", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRoles(data.data.roles || []);
        setAvailablePermissions(data.data.availablePermissions || []);
        if (data.data.roles.length > 0 && !newMemberRoleId) {
          setNewMemberRoleId(data.data.roles[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------------------------------------------------------------
  // Team Member Handlers
  // ----------------------------------------------------------------------
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddingMember(true);
    setAddMemberError(null);
    setInviteResult(null);

    const passwordToSet = newMemberPassword.trim() || "Goodwin@2026!";

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          fullName: newMemberName,
          phone: newMemberPhone,
          roleId: newMemberRoleId,
          password: passwordToSet,
          initialPassword: passwordToSet,
          status: "ACTIVE",
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setCreatedCredentials({
          email: newMemberEmail,
          password: passwordToSet,
          fullName: newMemberName || newMemberEmail.split("@")[0],
        });
        setNewMemberEmail("");
        setNewMemberName("");
        setNewMemberPhone("");
        setNewMemberPassword("Goodwin@2026!");
        setAddMemberModal(false);
        fetchTeam();
        fetchRoles();
      } else {
        setAddMemberError(resData.error || "Failed to add team member");
      }
    } catch (err: any) {
      setAddMemberError(err.message || "An error occurred");
    } finally {
      setAddingMember(false);
    }
  }

  function openEditMember(member: any) {
    setEditingMember(member);
    setEditMemberName(member.fullName);
    setEditMemberPhone(member.phone || "");
    setEditMemberStatus(member.status);
    setEditMemberRoleId(member.roleIds?.[0] || roles[0]?.id || "");
    setEditMemberPassword("");
    setEditMemberModal(true);
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMember(true);

    try {
      const updatePayload: any = {
        fullName: editMemberName,
        phone: editMemberPhone,
        status: editMemberStatus,
        roleId: editMemberRoleId,
      };
      if (editMemberPassword.trim()) {
        updatePayload.password = editMemberPassword.trim();
      }

      const res = await fetch(`/api/team/${editingMember.membershipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setEditMemberModal(false);
        setEditingMember(null);
        setEditMemberPassword("");
        fetchTeam();
        fetchRoles();
      } else {
        alert(resData.error || "Failed to update team member");
      }
    } catch {
      alert("Error updating team member");
    } finally {
      setSavingMember(false);
    }
  }

  async function handleQuickResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPwdMember) return;
    setResettingPwd(true);
    setResetPwdSuccess(null);

    try {
      const res = await fetch(`/api/team/${resetPwdMember.membershipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: resetPwdValue.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setResetPwdSuccess(`Password for ${resetPwdMember.fullName} updated successfully!`);
        fetchTeam();
      } else {
        alert(resData.error || "Failed to reset password");
      }
    } catch {
      alert("Error resetting password");
    } finally {
      setResettingPwd(false);
    }
  }

  async function handleDeleteMember(member: any) {
    if (!confirm(`Are you sure you want to remove "${member.fullName}" from this workspace?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${member.membershipId}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        if (viewMemberModal && viewingMember?.membershipId === member.membershipId) {
          setViewMemberModal(false);
        }
        fetchTeam();
        fetchRoles();
      } else {
        alert(resData.error || "Failed to remove member");
      }
    } catch {
      alert("Error removing team member");
    }
  }

  // ----------------------------------------------------------------------
  // Role Handlers
  // ----------------------------------------------------------------------
  function togglePermission(code: string, isCreate: boolean) {
    if (isCreate) {
      setNewRolePermissions((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    } else {
      setEditRolePermissions((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    }
  }

  function toggleModulePermissions(module: string, isCreate: boolean) {
    const moduleCodes = availablePermissions.filter((p) => p.module === module).map((p) => p.code);
    const targetList = isCreate ? newRolePermissions : editRolePermissions;
    const allSelected = moduleCodes.every((c) => targetList.includes(c));

    let updated: string[];
    if (allSelected) {
      updated = targetList.filter((c) => !moduleCodes.includes(c));
    } else {
      updated = Array.from(new Set([...targetList, ...moduleCodes]));
    }

    if (isCreate) {
      setNewRolePermissions(updated);
    } else {
      setEditRolePermissions(updated);
    }
  }

  function toggleAllGlobalPermissions(isCreate: boolean) {
    const allCodes = availablePermissions.map((p) => p.code);
    const targetList = isCreate ? newRolePermissions : editRolePermissions;
    const allSelected = allCodes.every((c) => targetList.includes(c));

    if (isCreate) {
      setNewRolePermissions(allSelected ? [] : allCodes);
    } else {
      setEditRolePermissions(allSelected ? [] : allCodes);
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setCreatingRole(true);
    setRoleError(null);

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          permissionCodes: newRolePermissions,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setCreateRoleModal(false);
        setNewRoleName("");
        setNewRoleDesc("");
        setNewRolePermissions([]);
        fetchRoles();
      } else {
        setRoleError(resData.error || "Failed to create role");
      }
    } catch (err: any) {
      setRoleError(err.message || "An error occurred");
    } finally {
      setCreatingRole(false);
    }
  }

  function openEditRole(role: any) {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDesc(role.description || "");
    setEditRolePermissions(role.permissionCodes || []);
    setEditRoleModal(true);
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    setSavingRole(true);

    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editRoleName,
          description: editRoleDesc,
          permissionCodes: editRolePermissions,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setEditRoleModal(false);
        setEditingRole(null);
        fetchRoles();
      } else {
        alert(resData.error || "Failed to update role");
      }
    } catch {
      alert("Error updating role");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDeleteRole(role: any) {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchRoles();
      } else {
        alert(resData.error || "Failed to delete role");
      }
    } catch {
      alert("Error deleting role");
    }
  }

  // Filtered members list
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.email.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.primaryRole.toLowerCase().includes(searchMember.toLowerCase());

    const matchesStatus =
      memberStatusFilter === "ALL" || m.status === memberStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group permissions by module
  const modulesList = Array.from(new Set(availablePermissions.map((p) => p.module)));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {orgForm.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img src={orgForm.logoUrl} alt={orgForm.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {(orgForm.name || sessionData?.activeTenant?.name || "G").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Management & Access</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Team members, role-based access controls (RBAC), and organization settings for{" "}
              <strong className="text-slate-800">{orgForm.name || sessionData?.activeTenant?.name || "Goodwin Workspace"}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "team"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({teamMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "roles"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Assigned CRM Roles & Permissions ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("organization")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "organization"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organization Profile</span>
        </button>
      </div>

      {/* ========================================================================================= */}
      {/* TAB 1: WORKSPACE TEAM MEMBERS */}
      {/* ========================================================================================= */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search members by name, email, or role..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs">
                {["ALL", "ACTIVE", "INVITED", "SUSPENDED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setMemberStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-[11px] ${
                      memberStatusFilter === st
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setAddMemberError(null);
                  setInviteResult(null);
                  setAddMemberModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Member Name</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Assigned CRM Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Workload Distribution</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">Loading team members...</td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">No team members found matching your search.</td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.membershipId} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                              {member.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{member.fullName}</span>
                                {member.isOwner && (
                                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {member.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {member.primaryRole}
                            </span>
                            {member.roles?.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                +{member.roles.length - 1} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              member.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : member.status === "INVITED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                            <span title="Assigned Leads" className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                              🎯 {member.workload?.leads || 0} leads
                            </span>
                            <span title="Assigned Deals" className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                              💼 {member.workload?.deals || 0} deals
                            </span>
                            <span title="Assigned Tasks" className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                              ✓ {member.workload?.tasks || 0} tasks
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">{formatDate(member.createdAt)}</td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setResetPwdMember(member);
                                setResetPwdValue("Goodwin@2026!");
                                setResetPwdSuccess(null);
                                setResetPwdModal(true);
                              }}
                              title="Set / Reset Account Password"
                              className="p-1 hover:bg-amber-50 rounded text-slate-400 hover:text-amber-600 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setViewingMember(member);
                                setViewMemberModal(true);
                              }}
                              title="View Details"
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditMember(member)}
                              title="Edit Member Role & Info"
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!member.isOwner && (
                              <button
                                onClick={() => handleDeleteMember(member)}
                                title="Remove Member from Workspace"
                                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 2: ASSIGNED CRM ROLES & RBAC MATRIX */}
      {/* ========================================================================================= */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Custom CRM Roles & Granular Permissions</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Define functional job roles (e.g. Sales Executive, Territory Manager, Support Specialist) and specify exact CRUD rights.
              </p>
            </div>

            <button
              onClick={() => {
                setRoleError(null);
                setNewRoleName("");
                setNewRoleDesc("");
                setNewRolePermissions(["leads:read", "deals:read", "tasks:read"]);
                setCreateRoleModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Role</span>
            </button>
          </div>

          {/* Roles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const isRootRole =
                role.name.toLowerCase().trim() === "company owner" ||
                role.name.toLowerCase().trim() === "super admin";

              return (
                <div
                  key={role.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/80 transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-950 transition">
                        {role.name}
                      </div>
                      {isRootRole ? (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                          Primary Workspace Role
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                          Editable Role
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {role.description || "Custom functional role controlling access to CRM modules."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Assigned Team Members:</span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        {role.memberCount || 0} members
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Granted Permissions:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {role.permissions?.length || 0} privileges
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setViewingRole(role);
                          setViewRoleModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Rights</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditRole(role)}
                          title="Edit Role & Permissions"
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isRootRole && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            title="Delete Role"
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 3: ORGANIZATION PROFILE */}
      {/* ========================================================================================= */}
      {activeTab === "organization" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Workspace Profile & Licensing</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                {orgForm.code || sessionData?.activeTenant?.code || "goodwin-crm"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {orgForm.status || sessionData?.activeTenant?.status || "ACTIVE"}
              </span>
            </div>
          </div>

          {orgMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                orgMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {orgMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveOrgSettings} className="space-y-5">
            {/* Workspace Brand Logo Upload */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Workspace Brand Logo</h4>
                  <p className="text-[11px] text-slate-500">
                    This logo updates across all workspace views: sidebar, header switcher, print tax invoices, dealer portal, and proposals.
                  </p>
                </div>
                {orgForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setOrgForm({ ...orgForm, logoUrl: "" })}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Logo
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
                  {orgForm.logoUrl ? (
                    <img src={orgForm.logoUrl} alt="Workspace Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[9px] font-bold uppercase mt-0.5">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-xs font-semibold shadow-xs transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingLogo ? "Compressing Image..." : "Upload Logo Image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploadingLogo}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">or enter an image URL below</span>
                  </div>

                  <input
                    type="url"
                    value={orgForm.logoUrl || ""}
                    onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or data:image/png;base64,..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-[11px]"
                  />
                  <div className="text-[10px] text-slate-400">
                    PNG, SVG, or WebP recommended. Uploaded files are automatically compressed client-side and saved into PostgreSQL.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Company Workspace Name *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="Goodwin Grow CRM"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Business Email</label>
                <input
                  type="email"
                  value={orgForm.businessEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, businessEmail: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Website</label>
                <input
                  type="text"
                  value={orgForm.website}
                  onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                  placeholder="https://www.company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Business Address</label>
                <input
                  type="text"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  placeholder="Corporate Office Address"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Country</label>
                <input
                  type="text"
                  value={orgForm.country}
                  onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                  placeholder="India"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Currency</label>
                  <select
                    value={orgForm.currency}
                    onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Timezone</label>
                  <select
                    value={orgForm.timezone}
                    onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500">
                Seat License Occupancy:{" "}
                <strong className="text-slate-800">
                  {teamMembers.length} / {orgForm.seatLimit || 10} active seats
                </strong>
              </div>
              <button
                type="submit"
                disabled={savingOrg}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingOrg ? "Saving..." : "Save Organization Profile"}</span>
              </button>
            </div>
          </form>

          {/* Workspace Data Sanitation */}
          <div className="pt-5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Workspace Data Management</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Purge any initial demo/dummy clients, mock leads, tasks, and creative assets from this workspace to start completely fresh.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to purge all pre-seeded dummy data from this workspace? Real team members will remain intact.")) {
                    try {
                      const res = await fetch("/api/agency/clean-dummy-data", { method: "POST" });
                      const d = await res.json();
                      alert(d.message || "Workspace dummy data cleaned!");
                      window.location.reload();
                    } catch (e) {
                      alert("Error cleaning dummy data");
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer shrink-0"
              >
                Purge All Dummy Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODALS */}
      {/* ========================================================================================= */}

      {/* 1. Add / Invite Member Modal */}
      {addMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Workspace Team Member</h2>
              <button onClick={() => setAddMemberModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addMemberError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {addMemberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="r.verma@company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned CRM Role *</label>
                <select
                  value={newMemberRoleId}
                  onChange={(e) => setNewMemberRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? "(Built-in)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Account Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = "Goodwin@" + Math.random().toString(36).slice(-6) + "!";
                      setNewMemberPassword(rand);
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Enter password (minimum 6 characters)"
                    className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Employee can sign in immediately with this email and password at /login.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Member Modal */}
      {editMemberModal && editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Member Access & Details</h2>
              <button onClick={() => setEditMemberModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editMemberPhone}
                  onChange={(e) => setEditMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned CRM Role</label>
                <select
                  value={editMemberRoleId}
                  onChange={(e) => setEditMemberRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Status</label>
                <select
                  value={editMemberStatus}
                  onChange={(e) => setEditMemberStatus(e.target.value)}
                  disabled={editingMember.isOwner}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INVITED">INVITED</option>
                </select>
                {editingMember.isOwner && (
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    Workspace Owner status cannot be changed.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    minLength={6}
                    value={editMemberPassword}
                    onChange={(e) => setEditMemberPassword(e.target.value)}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingMember ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. View Member Details Modal */}
      {viewMemberModal && viewingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                  {viewingMember.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{viewingMember.fullName}</h2>
                  <p className="text-xs text-slate-500">{viewingMember.email}</p>
                </div>
              </div>
              <button onClick={() => setViewMemberModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-semibold mb-0.5">Assigned Role</div>
                <div className="font-bold text-slate-900">{viewingMember.primaryRole}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-semibold mb-0.5">Member Status</div>
                <div className="font-bold text-emerald-700">{viewingMember.status}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Assigned CRM Workload</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-lg font-extrabold text-emerald-800">{viewingMember.workload?.leads || 0}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Active Leads</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-lg font-extrabold text-blue-800">{viewingMember.workload?.deals || 0}</div>
                  <div className="text-[10px] text-blue-700 font-semibold">Pipeline Deals</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-lg font-extrabold text-amber-800">{viewingMember.workload?.tasks || 0}</div>
                  <div className="text-[10px] text-amber-700 font-semibold">Tasks Queue</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create Role Modal */}
      {createRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Create Custom CRM Role</h2>
              <button onClick={() => setCreateRoleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {roleError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {roleError}
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Territory Sales Lead"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Summarize the functional access and scope of this role..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Permissions Checklist by Module */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span>Grant Granular Module Permissions</span>
                    <button
                      type="button"
                      onClick={() => toggleAllGlobalPermissions(true)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold cursor-pointer"
                    >
                      {newRolePermissions.length === availablePermissions.length ? "Deselect All (0)" : `Select All (${availablePermissions.length})`}
                    </button>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    {newRolePermissions.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {modulesList.map((module) => {
                    const modulePerms = availablePermissions.filter((p) => p.module === module);
                    const allInModuleSelected = modulePerms.every((p) => newRolePermissions.includes(p.code));

                    return (
                      <div key={module} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                            {module}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(module, true)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                          >
                            {allInModuleSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {modulePerms.map((perm) => (
                            <label
                              key={perm.code}
                              className="flex items-center gap-2 text-slate-700 cursor-pointer select-none text-[11px]"
                            >
                              <input
                                type="checkbox"
                                checked={newRolePermissions.includes(perm.code)}
                                onChange={() => togglePermission(perm.code, true)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span title={perm.description || perm.code}>{perm.code}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {creatingRole ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Role Modal */}
      {editRoleModal && editingRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Edit CRM Role: {editingRole.name}</h2>
              <button onClick={() => setEditRoleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  disabled={
                    editingRole.name.toLowerCase().trim() === "company owner" ||
                    editingRole.name.toLowerCase().trim() === "super admin"
                  }
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editRoleDesc}
                  onChange={(e) => setEditRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Permissions Checklist by Module */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span>Grant Granular Module Permissions</span>
                    <button
                      type="button"
                      onClick={() => toggleAllGlobalPermissions(false)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold cursor-pointer"
                    >
                      {editRolePermissions.length === availablePermissions.length ? "Deselect All (0)" : "Select All (" + availablePermissions.length + ")"}
                    </button>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    {editRolePermissions.length} selected
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {modulesList.map((module) => {
                    const modulePerms = availablePermissions.filter((p) => p.module === module);
                    const allInModuleSelected = modulePerms.every((p) => editRolePermissions.includes(p.code));

                    return (
                      <div key={module} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                            {module}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(module, false)}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                          >
                            {allInModuleSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {modulePerms.map((perm) => (
                            <label
                              key={perm.code}
                              className="flex items-center gap-2 text-slate-700 cursor-pointer select-none text-[11px]"
                            >
                              <input
                                type="checkbox"
                                checked={editRolePermissions.includes(perm.code)}
                                onChange={() => togglePermission(perm.code, false)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span title={perm.description || perm.code}>{perm.code}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingRole.name.toLowerCase().trim() !== "company owner" &&
                editingRole.name.toLowerCase().trim() !== "super admin" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditRoleModal(false);
                      handleDeleteRole(editingRole);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Role</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRoleModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingRole}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingRole ? "Saving..." : "Save Role"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Role Rights Modal */}
      {viewRoleModal && viewingRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{viewingRole.name} Privileges</h2>
                <p className="text-xs text-slate-500">{viewingRole.description || "Role privilege specification"}</p>
              </div>
              <button onClick={() => setViewRoleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              <div className="text-xs font-bold text-slate-800">
                Granted Privileges ({viewingRole.permissions?.length || 0})
              </div>

              <div className="flex flex-wrap gap-1.5">
                {viewingRole.permissions?.map((p: any) => (
                  <span
                    key={p.code}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100"
                  >
                    {p.code}
                  </span>
                ))}
              </div>

              {viewingRole.members && viewingRole.members.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">Assigned Team Members ({viewingRole.members.length})</div>
                  <div className="space-y-1">
                    {viewingRole.members.map((m: any) => (
                      <div key={m.userId} className="text-xs text-slate-600 flex items-center justify-between py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-900">{m.fullName}</span>
                        <span className="text-slate-400">{m.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRoleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. New Member Created Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Employee Account Created</h2>
                <p className="text-xs text-slate-500">Provide these login credentials to {createdCredentials.fullName}.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans font-medium">Employee Name:</span>
                <span className="font-bold text-slate-900">{createdCredentials.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans font-medium">Work Email:</span>
                <span className="font-bold text-slate-900 select-all">{createdCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans font-medium">Account Password:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                  {createdCredentials.password}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans font-medium">Login URL:</span>
                <span className="text-slate-700 select-all">/login</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const credsText = `Goodwin Grow CRM Account Credentials:\nName: ${createdCredentials.fullName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
                  navigator.clipboard.writeText(credsText);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCreds ? "Credentials Copied!" : "Copy Credentials"}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Quick Reset Password Modal */}
      {resetPwdModal && resetPwdMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Set Account Password</h2>
                  <p className="text-xs text-slate-500">{resetPwdMember.fullName} ({resetPwdMember.email})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResetPwdModal(false);
                  setResetPwdMember(null);
                  setResetPwdSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetPwdSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetPwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleQuickResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = "Goodwin@" + Math.random().toString(36).slice(-6) + "!";
                      setResetPwdValue(rand);
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPwd ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetPwdValue}
                    onChange={(e) => setResetPwdValue(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPwd(!showResetPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The employee can use this password to immediately log in to their account.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Goodwin Grow CRM Account Credentials:\nName: ${resetPwdMember.fullName}\nEmail: ${resetPwdMember.email}\nPassword: ${resetPwdValue}\nLogin URL: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
                    navigator.clipboard.writeText(text);
                    alert("Credentials copied to clipboard!");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Credentials</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPwdModal(false);
                      setResetPwdMember(null);
                      setResetPwdSuccess(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPwd}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{resettingPwd ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
