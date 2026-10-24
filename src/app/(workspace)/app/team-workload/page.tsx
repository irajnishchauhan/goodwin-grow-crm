"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gauge,
  Users2,
  Building2,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  Shield,
  Loader2,
  Save,
  X,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  membershipId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isOwner: boolean;
  status: string;
  roles: string[];
  roleIds: string[];
  primaryRole: string;
  workload: {
    leads: number;
    deals: number;
    tasks: number;
  };
}

interface RoleOption {
  id: string;
  name: string;
  description?: string | null;
}

export default function TeamWorkloadPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  // Add Member Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleId: "",
    initialPassword: "Goodwin@2026!",
  });

  // Edit Member Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    roleId: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchTeam();
    fetchRoles();
  }, []);

  async function fetchTeam() {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeam(data.data);
      }
    } catch (err) {
      console.error("Failed to load team:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success && data.data?.roles) {
        setRoles(data.data.roles);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMember.email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      setAddingMember(true);
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (data.success) {
        setAddModalOpen(false);
        setNewMember({
          fullName: "",
          email: "",
          phone: "",
          roleId: roles[0]?.id || "",
          initialPassword: "Goodwin@2026!",
        });
        fetchTeam();
      } else {
        alert(data.error || "Failed to add team member");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding team member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/team/${editingMember.membershipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingMember(null);
        fetchTeam();
      } else {
        alert(data.error || "Failed to update team member");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating team member");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteMember(member: TeamMember) {
    if (member.isOwner) {
      alert("Cannot remove workspace owner");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${member.fullName} (${member.email}) from this workspace?`
      )
    ) {
      return;
    }

    // Optimistic UI update
    setTeam((prev) => prev.filter((m) => m.membershipId !== member.membershipId));

    try {
      const res = await fetch(`/api/team/${member.membershipId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to remove member");
        fetchTeam();
      }
    } catch (err) {
      console.error(err);
      alert("Error removing team member");
      fetchTeam();
    }
  }

  function getCapacityPercent(tasks: number, leads: number) {
    const totalScore = tasks * 18 + leads * 8;
    return Math.min(100, Math.max(15, totalScore));
  }

  // Filtered Team
  const filteredTeam = team.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primaryRole.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRoleFilter === "ALL" ||
      m.roles.some((r) => r.toLowerCase() === selectedRoleFilter.toLowerCase()) ||
      m.primaryRole.toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // Aggregated Stats
  const totalTasks = team.reduce((acc, m) => acc + (m.workload?.tasks || 0), 0);
  const totalLeads = team.reduce((acc, m) => acc + (m.workload?.leads || 0), 0);
  const activeSpecialists = team.filter((m) => m.status === "ACTIVE").length;
  const avgCapacity =
    team.length > 0
      ? Math.round(
          team.reduce((acc, m) => acc + getCapacityPercent(m.workload?.tasks || 0, m.workload?.leads || 0), 0) /
            team.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Team Workload & Capacity
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live DB Roster
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workload distribution across workspace members, active tasks, assigned leads, and delivery bandwidth.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setNewMember({
                fullName: "",
                email: "",
                phone: "",
                roleId: roles[0]?.id || "",
                initialPassword: "Goodwin@2026!",
              });
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>

          <Link
            href="/app/settings?tab=team"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Users2 className="w-4 h-4 text-emerald-600" />
            <span>Role Permissions</span>
          </Link>
        </div>
      </div>

      {/* Real-time Capacity Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Active Tasks
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalTasks} Deliverables
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Distributed across {activeSpecialists} active members
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Assigned Leads
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalLeads} Prospects
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">
            Real-time pipeline follow-up tracking
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Workspace Pods
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {team.length} Team Members
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Verified accounts in current workspace
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Pod Bandwidth
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {avgCapacity}% Utilized
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {avgCapacity > 85 ? "High load - rebalance recommended" : "Optimal delivery capacity"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name, email, role..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
            >
              <option value="ALL">All Roles ({team.length})</option>
              {Array.from(new Set(team.map((m) => m.primaryRole))).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchTeam}
          className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
        >
          Refresh Roster
        </button>
      </div>

      {/* Team Member Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading verified team members...</span>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-2">
          <p className="font-bold text-slate-700">No team members found matching your search.</p>
          <p className="text-slate-500">Try adjusting search query or click below to add team members.</p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
          >
            Add Team Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((member) => {
            const capacity = getCapacityPercent(
              member.workload?.tasks || 0,
              member.workload?.leads || 0
            );
            const initials = member.fullName
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase() || "TM";

            return (
              <div
                key={member.membershipId}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{member.fullName}</h3>
                          {member.isOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {member.primaryRole}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          capacity >= 85
                            ? "bg-rose-100 text-rose-800"
                            : capacity >= 60
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {capacity}% Load
                      </span>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(member);
                          setEditForm({
                            fullName: member.fullName,
                            phone: member.phone || "",
                            roleId: member.roleIds[0] || "",
                            status: member.status,
                          });
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                        title="Edit member details & role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (safely disabled for owner) */}
                      {!member.isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Remove member from workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Live Workload Bandwidth</span>
                      <span>
                        {member.workload?.tasks || 0} tasks · {member.workload?.leads || 0} leads
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          capacity >= 85
                            ? "bg-rose-500"
                            : capacity >= 60
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacity}%` }}
                      />
                    </div>
                  </div>

                  {/* Workload 3-Column Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tasks</div>
                      <Link
                        href="/app/tasks"
                        className="text-base font-extrabold text-slate-900 hover:text-emerald-700"
                      >
                        {member.workload?.tasks || 0}
                      </Link>
                    </div>
                    <div className="border-x border-slate-200/70">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Leads</div>
                      <Link
                        href="/app/leads"
                        className="text-base font-extrabold text-blue-700 hover:text-blue-800"
                      >
                        {member.workload?.leads || 0}
                      </Link>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Deals</div>
                      <Link
                        href="/app/deals"
                        className="text-base font-extrabold text-emerald-700 hover:text-emerald-800"
                      >
                        {member.workload?.deals || 0}
                      </Link>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Roles: {member.roles.join(", ") || member.primaryRole}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span>{member.status}</span>
                  </span>
                  <Link
                    href={`/app/tasks?assignedToId=${member.userId}`}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 group text-xs"
                  >
                    <span>View Tasks Queue</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Add Workspace Team Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMember.fullName}
                  onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="name@goodwingrowai.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Role</label>
                <select
                  value={newMember.roleId}
                  onChange={(e) => setNewMember({ ...newMember, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select a Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={newMember.initialPassword}
                  onChange={(e) => setNewMember({ ...newMember, initialPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {addingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Member: {editingMember.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editForm.roleId}
                  onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Keep current role</option>
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
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
