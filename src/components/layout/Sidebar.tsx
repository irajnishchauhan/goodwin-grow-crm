"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  Building2,
  Layers,
  Kanban,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isPlatformAdmin?: boolean;
}

const navItems = [
  {
    category: "CORE CRM",
    links: [
      { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/app/leads", icon: TrendingUp },
      { name: "Deals & Pipelines", href: "/app/deals", icon: Kanban },
      { name: "Contacts", href: "/app/contacts", icon: Users2 },
      { name: "Companies", href: "/app/companies", icon: Building2 },
    ],
  },
  {
    category: "PRODUCTIVITY",
    links: [
      { name: "Tasks", href: "/app/tasks", icon: CheckSquare },
      { name: "Activities", href: "/app/activities", icon: Clock },
      { name: "Quotations", href: "/app/quotations", icon: FileSpreadsheet },
    ],
  },
  {
    category: "MANAGEMENT",
    links: [
      { name: "Company Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ isPlatformAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Goodwin Grow <span className="text-emerald-600 font-extrabold">CRM</span>
          </div>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Goodwin Grow AI
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navItems.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-3 uppercase mb-2">
              {group.category}
            </div>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Platform Super Admin Quick Link */}
      {isPlatformAdmin && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/platform"
            className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>Platform Admin</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
          </Link>
        </div>
      )}
    </aside>
  );
}
