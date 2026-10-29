"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Layers,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Building2,
  Check,
  Plus,
  ArrowRight,
  LogOut,
  User,
  Shield,
  KeyRound,
  ExternalLink,
} from "lucide-react";

interface PlatformNavbarProps {
  initialWorkspaces?: any[];
  currentUser?: {
    id: string;
    email: string;
    fullName: string;
    isPlatformAdmin: boolean;
  } | null;
  activeTenantId?: string | null;
}

export function PlatformNavbar({
  initialWorkspaces = [],
  currentUser = null,
  activeTenantId = null,
}: PlatformNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<any[]>(initialWorkspaces);
  const [user, setUser] = useState<any>(currentUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch workspaces & user session if not supplied
    async function loadData() {
      try {
        const res = await fetch("/api/platform/workspaces");
        if (res.status === 401) {
          return;
        }
        const data = await res.json();
        if (data.success && data.workspaces) {
          setWorkspaces(data.workspaces);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (initialWorkspaces.length === 0) {
      loadData();
    }
  }, [initialWorkspaces]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitch(workspace: any) {
    try {
      setSwitching(true);
      const res = await fetch("/api/platform/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: workspace.id, code: workspace.code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDropdownOpen(false);
        window.location.href = "/app/dashboard";
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        alert(data.error || "Failed to switch workspace");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching workspace");
    } finally {
      setSwitching(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid Super Admin credentials");
      }
      setAdminModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  const isSuperAdminPage = pathname.startsWith("/super-admin");
  const isPlatformOverview = pathname === "/platform" || pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand + Workspace Switcher */}
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2.5 group" href="/platform">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 flex items-center justify-center font-bold text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                <Layers className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Goodwin Grow <span className="text-emerald-600">CRM</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    SaaS Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-0.5">Enterprise Multi-Tenant Platform</p>
              </div>
            </Link>

            {/* Workspace Switcher Button */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-all max-w-[260px] cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-900 truncate">
                  {isSuperAdminPage
                    ? "Super Admin Console"
                    : isPlatformOverview
                    ? "Platform Overview"
                    : "Switch Workspace"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
              </button>

              {/* Workspace Switcher Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Client Workspace
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {workspaces.length} Available
                    </span>
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    <Link
                      href="/platform"
                      onClick={() => setDropdownOpen(false)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition ${
                        isPlatformOverview
                          ? "bg-emerald-50 text-emerald-800 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">Platform Overview</div>
                          <div className="text-[10px] text-slate-400">Fleet telemetry &amp; security</div>
                        </div>
                      </div>
                      {isPlatformOverview && <Check className="w-4 h-4 text-emerald-600" />}
                    </Link>

                    {workspaces.map((w) => {
                      const isCurrent = w.id === activeTenantId || w.isCurrent;
                      return (
                        <button
                          key={w.id}
                          disabled={switching}
                          onClick={() => handleSwitch(w)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition cursor-pointer ${
                            isCurrent
                              ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {w.settings?.logoUrl ? (
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                                <img src={w.settings.logoUrl} alt={w.name} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {w.name?.charAt(0) || "W"}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-semibold text-slate-900 truncate">{w.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {w.code} • {w.planName || "Growth"}
                              </div>
                            </div>
                          </div>
                          {isCurrent ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium shrink-0 group-hover:text-emerald-600">
                              Launch →
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <Link
                      href="/super-admin"
                      onClick={() => setDropdownOpen(false)}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Super Admin Console</span>
                    </Link>
                    <Link
                      href="/app/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <span>Open CRM</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Security Badge, Super Admin, CRM launch */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-[11px] tracking-wide">Tenant Isolation Enforced</span>
            </div>

            <Link
              href="/super-admin"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </Link>

            <Link
              href="/app/dashboard"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
            >
              <span>Launch CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div
                  className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                  title={`${currentUser.fullName} (${currentUser.email})`}
                >
                  {currentUser.fullName?.charAt(0) || "U"}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Super Admin Authentication Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Platform Super Admin Login</h3>
                  <p className="text-[11px] text-slate-500">Unrestricted CRUD &amp; tenant fleet control</p>
                </div>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Super Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loginLoading ? "Authenticating..." : "Sign In as Super Admin"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
