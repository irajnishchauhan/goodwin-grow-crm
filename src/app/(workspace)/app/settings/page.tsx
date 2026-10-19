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
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<any | null>(null);

  // Edit Member Modal
  const [editMemberModal, setEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberRoleId, setEditMemberRoleId] = useState("");
  const [editMemberStatus, setEditMemberStatus] = useState("ACTIVE");
  const [savingMember, setSavingMember] = useState(false);

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

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([fetchSession(), fetchTeam(), fetchRoles()]);
    setLoading(false);
  }

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/session");
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
      const res = await fetch("/api/team");
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
      const res = await fetch("/api/roles");
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

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          fullName: newMemberName,
          phone: newMemberPhone,
          roleId: newMemberRoleId,
          status: "ACTIVE",
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setNewMemberEmail("");
        setNewMemberName("");
        setNewMemberPhone("");
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
    setEditMemberModal(true);
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMember(true);

    try {
      const res = await fetch(`/api/team/${editingMember.membershipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editMemberName,
          phone: editMemberPhone,
          status: editMemberStatus,
          roleId: editMemberRoleId,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setEditMemberModal(false);
        setEditingMember(null);
        fetchTeam();
        fetchRoles();
      } else {
        alert(resData.error || "Failed to update team member");
      }
    } catch (err: any) {
      alert("Error updating team member");
    } finally {
      setSavingMember(false);
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Management & Access</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Team members, role-based access controls (RBAC), and organization settings for {sessionData?.activeTenant?.name || "Goodwin Workspace"}.
          </p>
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
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/80 transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-950 transition">
                      {role.name}
                    </div>
                    {role.isSystem ? (
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                        System Default
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        Workspace Custom
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
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          title="Delete Custom Role"
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* TAB 3: ORGANIZATION PROFILE */}
      {/* ========================================================================================= */}
      {activeTab === "organization" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Workspace Profile & Licensing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <div className="text-slate-400 font-semibold mb-1">Company Workspace</div>
              <div className="text-slate-900 font-bold text-sm">
                {sessionData?.activeTenant?.name || "Goodwin Grow CRM"}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-1">Workspace Code</div>
              <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
                {sessionData?.activeTenant?.code || "goodwin-crm"}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-1">Seat License Occupancy</div>
              <div className="font-semibold text-slate-800">
                {teamMembers.length} active seats in this workspace
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-1">Tenant Status</div>
              <div className="text-emerald-700 font-bold">
                {sessionData?.activeTenant?.status || "ACTIVE"}
              </div>
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
                  <span>Grant Granular Module Permissions</span>
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
                  disabled={editingRole.isSystem && editingRole.tenantId === null}
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
                  <span>Grant Granular Module Permissions</span>
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
