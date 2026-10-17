"use client";

import { useEffect, useState } from "react";
import { Settings, Users, Shield, Building2, Mail, Plus, X, CheckCircle2, Copy } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("Sales Executive");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/session");
      const sessionData = await res.json();
      if (sessionData.success) {
        setData(sessionData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setInviteResult(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, roleName }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setInviteResult(resData.data);
        setEmail("");
        setFullName("");
        fetchSettings();
      } else {
        setError(resData.error || "Failed to invite team member");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Settings & Team</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure corporate CRM parameters, team access permissions, and subscription limits.
        </p>
      </div>

      {/* Organization Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Organization Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-semibold mb-1">Company Workspace</div>
            <div className="text-slate-900 font-bold text-sm">
              {data?.activeTenant?.name || "Goodwin Grow CRM Workspace"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Workspace Code</div>
            <div className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
              {data?.activeTenant?.code || "goodwin-crm"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Active Roles</div>
            <div className="text-slate-900 font-semibold">
              {data?.roles?.join(", ") || "Company Admin"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold mb-1">Status</div>
            <div className="text-emerald-700 font-bold">
              {data?.activeTenant?.status || "ACTIVE"}
            </div>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Workspace Team Members</span>
          </div>

          <button
            onClick={() => {
              setInviteResult(null);
              setError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <p>
            Users invited to this workspace have strictly scoped access and cannot see any other company records.
          </p>
        </div>
      </div>

      {/* Invite Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Invite New Team Member</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            {inviteResult && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Invitation Generated!</span>
                </div>
                <div className="text-slate-600">
                  Send this link to <span className="font-bold text-slate-800">{inviteResult.email}</span> to activate their seat:
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-300 font-mono text-[11px] break-all select-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}{inviteResult.inviteUrl}
                </div>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team Member Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned CRM Role *
                </label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Sales Manager">Sales Manager (Team oversight & quotations)</option>
                  <option value="Sales Executive">Sales Executive (Manage leads & deals)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
