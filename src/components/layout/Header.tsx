"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  } | null;
  memberships: Array<{
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    isOwner: boolean;
  }>;
  roles?: string[];
}

export function Header({ user, activeTenant, memberships, roles = [] }: HeaderProps) {
  const router = useRouter();
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    leads: any[];
    contacts: any[];
    companies: any[];
    deals: any[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitchTenant(tenantId: string) {
    if (tenantId === activeTenant?.id) {
      setCompanyMenuOpen(false);
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

  const hasResults =
    searchResults &&
    (searchResults.leads.length > 0 ||
      searchResults.contacts.length > 0 ||
      searchResults.companies.length > 0 ||
      searchResults.deals.length > 0);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-20 relative">
      {/* Left: Company Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              {activeTenant ? activeTenant.name.charAt(0) : "G"}
            </div>
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
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Switch Organization Workspace
              </div>
              <div className="mt-1 space-y-1">
                {memberships.map((m) => {
                  const isCurrent = m.tenantId === activeTenant?.id;
                  return (
                    <button
                      key={m.tenantId}
                      disabled={switching}
                      onClick={() => handleSwitchTenant(m.tenantId)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-800 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2
                          className={`w-4 h-4 ${isCurrent ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{m.tenantName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.tenantCode}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="hidden md:flex items-center max-w-md w-full mx-6 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, deals, contacts, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 p-3 z-50 max-h-96 overflow-y-auto space-y-3">
            {searchLoading ? (
              <div className="text-xs text-slate-400 text-center py-4">Searching workspace...</div>
            ) : !hasResults ? (
              <div className="text-xs text-slate-400 text-center py-4">No matching records found.</div>
            ) : (
              <>
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span>Leads</span>
                    </div>
                    {searchResults.leads.map((l) => (
                      <a
                        key={l.id}
                        href="/app/leads"
                        className="block p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-800"
                      >
                        <span className="font-semibold">{l.firstName} {l.lastName}</span>
                        {l.companyName && <span className="text-slate-400"> • {l.companyName}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {searchResults.deals.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Kanban className="w-3 h-3 text-cyan-600" />
                      <span>Deals</span>
                    </div>
                    {searchResults.deals.map((d) => (
                      <a
                        key={d.id}
                        href="/app/deals"
                        className="block p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-800"
                      >
                        <span className="font-semibold">{d.title}</span>
                        <span className="text-emerald-700 font-bold ml-1.5">₹{Number(d.value).toLocaleString("en-IN")}</span>
                      </a>
                    ))}
                  </div>
                )}

                {searchResults.contacts.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users2 className="w-3 h-3 text-teal-600" />
                      <span>Contacts</span>
                    </div>
                    {searchResults.contacts.map((c) => (
                      <a
                        key={c.id}
                        href="/app/contacts"
                        className="block p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-800"
                      >
                        <span className="font-semibold">{c.firstName} {c.lastName}</span>
                        {c.email && <span className="text-slate-400"> • {c.email}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {searchResults.companies.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-600" />
                      <span>Companies</span>
                    </div>
                    {searchResults.companies.map((co) => (
                      <a
                        key={co.id}
                        href="/app/companies"
                        className="block p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-800 font-semibold"
                      >
                        {co.name}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-3">
        <div className="relative">
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
                <div className="py-1">
                  <a
                    href="/platform"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Platform Admin Portal</span>
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
    </header>
  );
}
