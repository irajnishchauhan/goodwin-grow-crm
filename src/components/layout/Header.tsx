"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Check,
  LogOut,
  User,
  Shield,
  Search,
  Users2,
  TrendingUp,
  Kanban,
  X,
  Sparkles,
  Command,
  Plus,
  Calendar,
  FileSpreadsheet,
  Megaphone,
  CheckSquare,
  Clock,
  Battery,
  Truck,
  Wrench,
  Receipt,
  MapPin,
  ArrowRight,
  Bell,
} from "lucide-react";

interface HeaderProps {
  user: {
    fullName: string;
    email: string;
    isPlatformAdmin: boolean;
  };
  activeTenant: {
    id: string;
    name: string;
    code: string;
    logoUrl?: string | null;
  } | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    tenantLogoUrl?: string | null;
    isOwner: boolean;
  }>;
  roles?: string[];
}

export function Header({ user, activeTenant, memberships, roles = [] }: HeaderProps) {
  const router = useRouter();
  const [currentLogo, setCurrentLogo] = useState<string | null>(activeTenant?.logoUrl || null);

  useEffect(() => {
    setCurrentLogo(activeTenant?.logoUrl || null);
  }, [activeTenant?.logoUrl]);

  useEffect(() => {
    function handleLogoUpdated(e: any) {
      if (e.detail?.logoUrl !== undefined) {
        setCurrentLogo(e.detail.logoUrl);
      }
    }
    window.addEventListener("workspace-logo-updated", handleLogoUpdated);
    return () => window.removeEventListener("workspace-logo-updated", handleLogoUpdated);
  }, []);

  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  const companyMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Command Palette State
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    leads: any[];
    contacts: any[];
    companies: any[];
    deals: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isBattery = activeTenant?.code?.includes("batteries");

  // Global Cmd+K / Ctrl+K Shortcut Listener & Outside Click Handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setCompanyMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (companyMenuRef.current && !companyMenuRef.current.contains(target)) {
        setCompanyMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (notificationsOpen && notifications.length === 0) {
      setNotificationsLoading(true);
      Promise.all([
        fetch("/api/activities").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/tasks").then((r) => r.json()).catch(() => ({ data: [] })),
      ])
        .then(([actRes, taskRes]) => {
          const items: any[] = [];
          const acts = Array.isArray(actRes?.data) ? actRes.data.slice(0, 4) : [];
          const tasks = Array.isArray(taskRes?.data) ? taskRes.data.slice(0, 4) : [];
          for (const a of acts) {
            items.push({
              id: `act-${a.id}`,
              title: a.subject || a.type || "Activity logged",
              subtitle: a.notes || a.performedBy?.fullName || "Workspace activity",
              href: "/app/activities",
              badge: a.type || "ACTIVITY",
            });
          }
          for (const t of tasks) {
            items.push({
              id: `task-${t.id}`,
              title: t.title || "Assigned task",
              subtitle: t.status ? `Status: ${t.status}` : "Task item",
              href: "/app/tasks",
              badge: t.priority || "TASK",
            });
          }
          setNotifications(items.slice(0, 6));
        })
        .finally(() => setNotificationsLoading(false));
    }
  }, [notificationsOpen, notifications.length]);

  // Auto-focus search input when palette opens
  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSearchResults(null);
    }
  }, [paletteOpen]);

  // Live search debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSwitchTenant(tenantId: string) {
    if (tenantId === activeTenant?.id) {
      setCompanyMenuOpen(false);
      setPaletteOpen(false);
      return;
    }

    try {
      setSwitching(true);
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (res.ok) {
        setCompanyMenuOpen(false);
        setPaletteOpen(false);
        window.location.href = "/app/dashboard";
      } else {
        alert("Failed to switch workspace");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching workspace");
    } finally {
      setSwitching(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  const quickNavLinks = isBattery
    ? [
        { label: "Dealers & Channel Network", href: "/app/dealers", icon: Building2 },
        { label: "Dispatch & Orders Register", href: "/app/orders", icon: Truck },
        { label: "Warranty Claims & Service", href: "/app/warranty", icon: Wrench },
        { label: "Outstanding & Collections", href: "/app/collections", icon: Receipt },
        { label: "Field Force Visits", href: "/app/field-visits", icon: MapPin },
        { label: "Sales Quotations", href: "/app/quotations", icon: FileSpreadsheet },
        { label: "Activities & Timeline", href: "/app/activities", icon: Clock },
      ]
    : [
        { label: "Leads Pipeline", href: "/app/leads", icon: TrendingUp },
        { label: "Deals & Revenue Board", href: "/app/deals", icon: Kanban },
        { label: "Clients 360° Management", href: "/app/clients", icon: Building2 },
        { label: "Client Onboarding Hub", href: "/app/clients/onboarding", icon: Sparkles },
        { label: "Contracts & Renewals", href: "/app/clients/renewals", icon: Clock },
        { label: "Campaigns Management", href: "/app/campaigns", icon: Megaphone },
        { label: "Meta Ad Campaigns", href: "/app/meta-ads", icon: Megaphone },
        { label: "Google Ad Campaigns", href: "/app/google-ads", icon: Megaphone },
        { label: "Content Calendar Hub", href: "/app/content-calendar", icon: Calendar },
        { label: "Proposals & Quotations", href: "/app/proposals", icon: FileSpreadsheet },
        { label: "Activities & Client Logs", href: "/app/activities", icon: Clock },
      ];

  const quickActionShortcuts = [
    { label: "New Lead", href: "/app/leads", badge: "+ Add", icon: TrendingUp },
    { label: "New Deal", href: "/app/deals", badge: "+ Add", icon: Kanban },
    { label: "New Task", href: "/app/tasks", badge: "+ Add", icon: CheckSquare },
    { label: "Log Activity", href: "/app/activities", badge: "+ Log", icon: Clock },
    { label: "New Quotation", href: "/app/quotations", badge: "+ Quote", icon: FileSpreadsheet },
  ];

  const hasSearchResults =
    searchResults &&
    (searchResults.leads.length > 0 ||
      searchResults.contacts.length > 0 ||
      searchResults.companies.length > 0 ||
      searchResults.deals.length > 0);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-20 relative">
      {/* Left: Company Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={companyMenuRef}>
          <button
            onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer"
          >
            {currentLogo ? (
              <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0">
                <img src={currentLogo} alt={activeTenant?.name || "Logo"} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {activeTenant ? activeTenant.name.charAt(0) : "G"}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {activeTenant ? activeTenant.name : "Select Workspace"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeTenant ? activeTenant.code : "no-tenant"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Company Switcher Dropdown */}
          {companyMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Organization Workspace
                </span>
                {user.isPlatformAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Fleet Super Admin
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1 max-h-64 overflow-y-auto pr-1">
                {memberships.map((m) => {
                  const isCurrent = m.tenantId === activeTenant?.id;
                  const itemLogo = isCurrent && currentLogo ? currentLogo : m.tenantLogoUrl;
                  return (
                    <button
                      key={m.tenantId}
                      disabled={switching}
                      onClick={() => handleSwitchTenant(m.tenantId)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/60"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {itemLogo ? (
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                            <img src={itemLogo} alt={m.tenantName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {m.tenantName.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{m.tenantName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.tenantCode}</div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">Switch →</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {user.isPlatformAdmin && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <a
                    href="/super-admin"
                    className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Super Admin Console</span>
                  </a>
                  <a
                    href="/platform"
                    className="font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Platform Overview
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger Button */}
      <div className="hidden md:flex items-center max-w-md w-full mx-6">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-400 transition cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            <span className="text-slate-500 font-medium">Quick jump, search or action...</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-500 shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Workspace Notifications"
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications & Activity</span>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/app/activities");
                  }}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1">
                {notificationsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading recent updates...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No new notifications in {activeTenant?.name || "workspace"}.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-800 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              {user.fullName ? user.fullName.charAt(0) : "U"}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user.fullName}</div>
              <div className="text-[10px] text-slate-400">
                {roles[0] || (user.isPlatformAdmin ? "Platform Owner" : "Member")}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
              </div>

              {user.isPlatformAdmin && (
                <div className="py-1 border-b border-slate-100 space-y-0.5">
                  <a
                    href="/super-admin"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Super Admin Console</span>
                  </a>
                  <a
                    href="/platform"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>Platform Overview</span>
                  </a>
                </div>
              )}

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Cmd+K Spotlight Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Search className="w-5 h-5 text-emerald-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type to search records, jump to a page, or run a quick action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 font-medium"
              />
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-400">
                  ESC
                </span>
                <button
                  onClick={() => setPaletteOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-5 flex-1">
              {/* If Searching */}
              {searchQuery.trim().length >= 2 ? (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Search Results
                  </div>
                  {searchLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400">Searching records...</div>
                  ) : !hasSearchResults ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No records found matching "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.leads.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Leads</span>
                          </div>
                          <div className="space-y-1">
                            {searchResults.leads.map((l) => (
                              <button
                                key={l.id}
                                onClick={() => {
                                  setPaletteOpen(false);
                                  router.push("/app/leads");
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-800 transition"
                              >
                                <span className="font-semibold">{l.firstName} {l.lastName}</span>
                                {l.companyName && <span className="text-slate-400">{l.companyName}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.deals.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-cyan-700 mb-1 flex items-center gap-1">
                            <Kanban className="w-3.5 h-3.5" />
                            <span>Deals</span>
                          </div>
                          <div className="space-y-1">
                            {searchResults.deals.map((d) => (
                              <button
                                key={d.id}
                                onClick={() => {
                                  setPaletteOpen(false);
                                  router.push("/app/deals");
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-800 transition"
                              >
                                <span className="font-semibold">{d.title}</span>
                                <span className="text-emerald-700 font-bold">
                                  ₹{Number(d.value).toLocaleString("en-IN")}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.contacts.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-teal-700 mb-1 flex items-center gap-1">
                            <Users2 className="w-3.5 h-3.5" />
                            <span>Contacts</span>
                          </div>
                          <div className="space-y-1">
                            {searchResults.contacts.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setPaletteOpen(false);
                                  router.push("/app/contacts");
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-800 transition"
                              >
                                <span className="font-semibold">{c.firstName} {c.lastName}</span>
                                {c.email && <span className="text-slate-400">{c.email}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.companies.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Companies</span>
                          </div>
                          <div className="space-y-1">
                            {searchResults.companies.map((co) => (
                              <button
                                key={co.id}
                                onClick={() => {
                                  setPaletteOpen(false);
                                  router.push("/app/companies");
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left text-xs text-slate-800 font-semibold transition"
                              >
                                <span>{co.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Quick Creation Actions */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Quick Actions
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {quickActionShortcuts.map((act) => {
                        const Icon = act.icon;
                        return (
                          <button
                            key={act.label}
                            onClick={() => {
                              setPaletteOpen(false);
                              router.push(act.href);
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition text-left cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 group-hover:border-emerald-300">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                                {act.label}
                              </div>
                              <div className="text-[10px] text-slate-400">{act.badge}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Navigation Pages */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Quick Navigation
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {quickNavLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.href}
                            onClick={() => {
                              setPaletteOpen(false);
                              router.push(item.href);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 group-hover:font-semibold">
                                {item.label}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Switch Organization Workspace */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Switch Active Organization
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {memberships.map((m) => {
                        const isCurrent = m.tenantId === activeTenant?.id;
                        const itemLogo = isCurrent && currentLogo ? currentLogo : m.tenantLogoUrl;
                        return (
                          <button
                            key={m.tenantId}
                            disabled={switching}
                            onClick={() => handleSwitchTenant(m.tenantId)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isCurrent
                                ? "bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {itemLogo ? (
                                <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
                                  <img src={itemLogo} alt={m.tenantName} className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                                  {m.tenantName.charAt(0)}
                                </div>
                              )}
                              <div className="truncate">
                                <div className="text-xs truncate">{m.tenantName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{m.tenantCode}</div>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Navigate with mouse or keyboard</span>
                <span>•</span>
                <span>Press <strong>ESC</strong> to dismiss</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                Goodwin Multi-Tenant Suite
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

