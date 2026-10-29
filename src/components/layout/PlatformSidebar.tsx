"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Building2,
  CreditCard,
  ArrowLeft,
  LogOut,
  Layers,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const platformLinks = [
  { name: "Platform Overview", href: "/platform", icon: ShieldAlert },
  { name: "Super Admin Console", href: "/super-admin", icon: Sparkles },
  { name: "Client Companies", href: "/platform/clients", icon: Building2 },
  { name: "Subscription Plans", href: "/platform/plans", icon: CreditCard },
  { name: "Workspace Settings", href: "/app/settings", icon: Settings },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-100 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md">
          <Layers className="w-5 h-5 font-bold" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            Platform <span className="text-emerald-400 font-extrabold">Control</span>
          </div>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Goodwin Grow AI
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 px-3 uppercase mb-2">
          SUPER ADMIN MODULES
        </div>
        {platformLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <Link
          href="/app/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch to CRM Workspace</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
