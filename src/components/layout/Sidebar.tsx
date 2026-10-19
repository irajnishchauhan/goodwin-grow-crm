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
  Calendar,
  Package,
  Zap,
  BarChart3,
  FolderKanban,
  CheckCircle2,
  Share2,
  Target,
  Search,
  Globe,
  Megaphone,
  Receipt,
  CreditCard,
  Wallet,
  LineChart,
  Puzzle,
  DollarSign,
  Sparkles,
  ExternalLink,
  Gauge,
  BatteryCharging,
  Store,
  MapPin,
  ShoppingBag,
  Cpu,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isPlatformAdmin?: boolean;
  activeTenant?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// 1. Marketing Agency Operating System (Goodwin Grow AI)
const agencyNavGroups = [
  {
    category: "SALES",
    links: [
      { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/app/leads", icon: TrendingUp },
      { name: "Contacts", href: "/app/contacts", icon: Users2 },
      { name: "Deals", href: "/app/deals", icon: Kanban },
      { name: "Proposals", href: "/app/proposals", icon: FileSpreadsheet },
    ],
  },
  {
    category: "CLIENTS",
    links: [
      { name: "All Clients", href: "/app/clients", icon: Building2 },
      { name: "Onboarding", href: "/app/clients/onboarding", icon: Sparkles },
      { name: "Retainers", href: "/app/clients/retainers", icon: Package },
      { name: "Client Portal", href: "/app/clients/portal", icon: ExternalLink },
      { name: "Renewals", href: "/app/clients/renewals", icon: Clock },
    ],
  },
  {
    category: "OPERATIONS",
    links: [
      { name: "Projects", href: "/app/projects", icon: FolderKanban },
      { name: "Tasks", href: "/app/tasks", icon: CheckSquare },
      { name: "Content Calendar", href: "/app/content-calendar", icon: Calendar },
      { name: "Creative Approvals", href: "/app/creative-approvals", icon: CheckCircle2 },
      { name: "Team Workload", href: "/app/team-workload", icon: Gauge },
    ],
  },
  {
    category: "MARKETING",
    links: [
      { name: "Social Media", href: "/app/social-media", icon: Share2 },
      { name: "Meta Ads", href: "/app/meta-ads", icon: Target },
      { name: "Google Ads", href: "/app/google-ads", icon: Search },
      { name: "SEO & Local GBP", href: "/app/seo", icon: Globe },
      { name: "Campaigns", href: "/app/campaigns", icon: Megaphone },
    ],
  },
  {
    category: "FINANCE",
    links: [
      { name: "Invoices", href: "/app/invoices", icon: Receipt },
      { name: "Payments", href: "/app/payments", icon: CreditCard },
      { name: "Expenses", href: "/app/expenses", icon: Wallet },
      { name: "Profitability", href: "/app/profitability", icon: LineChart },
      { name: "Reports", href: "/app/reports", icon: BarChart3 },
    ],
  },
  {
    category: "ADMINISTRATION",
    links: [
      { name: "Automations", href: "/app/automations", icon: Zap },
      { name: "Integrations", href: "/app/integrations", icon: Puzzle },
      { name: "Team & Roles", href: "/app/settings?tab=team", icon: ShieldCheck },
      { name: "Settings", href: "/app/settings", icon: Settings },
      { name: "Subscriptions", href: "/platform/plans", icon: DollarSign },
    ],
  },
];

// 2. Goodwin Batteries - Battery Sales & Distribution CRM
const batteriesNavGroups = [
  {
    category: "DISTRIBUTION NETWORK",
    links: [
      { name: "Dealers", href: "/app/dealers?tab=dealers", icon: Building2 },
      { name: "Distributors", href: "/app/dealers?tab=distributors", icon: Share2 },
      { name: "Retailers", href: "/app/dealers?tab=retailers", icon: Store },
      { name: "Field Sales Visits", href: "/app/field-visits", icon: MapPin },
    ],
  },
  {
    category: "SALES & PIPELINE",
    links: [
      { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
      { name: "Leads & Enquiries", href: "/app/leads", icon: TrendingUp },
      { name: "Sales Pipeline", href: "/app/deals", icon: Kanban },
      { name: "Quotations", href: "/app/quotations", icon: FileSpreadsheet },
      { name: "Purchase Orders", href: "/app/orders", icon: ShoppingBag },
    ],
  },
  {
    category: "FINANCIALS & ERP SYNC",
    links: [
      { name: "Collections & Ageing", href: "/app/collections", icon: Wallet },
      { name: "ERP Invoices", href: "/app/invoices", icon: Receipt },
      { name: "ERP Boundary Sync", href: "/app/integrations", icon: Cpu },
    ],
  },
  {
    category: "SERVICE & PRODUCTS",
    links: [
      { name: "Warranty & Service", href: "/app/warranty", icon: ShieldAlert },
      { name: "Battery Catalog", href: "/app/products", icon: BatteryCharging },
    ],
  },
  {
    category: "INTELLIGENCE & PORTAL",
    links: [
      { name: "Reports & Analytics", href: "/app/reports", icon: BarChart3 },
      { name: "Dealer Partner Portal", href: "/app/portal", icon: ExternalLink },
      { name: "Company Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

// 3. Standard Enterprise Sales & Distribution CRM
const standardNavGroups = [
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
      { name: "Calendar", href: "/app/calendar", icon: Calendar },
      { name: "Activities", href: "/app/activities", icon: Clock },
      { name: "Quotations", href: "/app/quotations", icon: FileSpreadsheet },
      { name: "Products", href: "/app/products", icon: Package },
    ],
  },
  {
    category: "INTELLIGENCE & SETUP",
    links: [
      { name: "Automations", href: "/app/automations", icon: Zap },
      { name: "Analytics & Reports", href: "/app/reports", icon: BarChart3 },
      { name: "Team & CRM Roles", href: "/app/settings?tab=team", icon: ShieldCheck },
      { name: "Company Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ isPlatformAdmin, activeTenant }: SidebarProps) {
  const pathname = usePathname();
  const isAgency = activeTenant?.code === "goodwin-grow-ai";
  const isBatteries = activeTenant?.code === "goodwin-batteries";
  const navGroups = isAgency ? agencyNavGroups : isBatteries ? batteriesNavGroups : standardNavGroups;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen select-none shrink-0 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-all",
            isAgency
              ? "bg-gradient-to-tr from-indigo-600 via-emerald-600 to-teal-500 shadow-emerald-600/20"
              : isBatteries
              ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-emerald-600 shadow-amber-600/20"
              : "bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 shadow-emerald-700/20"
          )}
        >
          {isBatteries ? <BatteryCharging className="w-5 h-5 text-white" /> : <Layers className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold tracking-tight text-slate-900 truncate flex items-center gap-1.5">
            {activeTenant?.name || "Goodwin Grow"}{" "}
            <span className={cn("font-extrabold text-xs", isBatteries ? "text-amber-600" : "text-emerald-600")}>
              {isBatteries ? "POWER" : "CRM"}
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-400">
            {isAgency ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Agency OS
              </span>
            ) : isBatteries ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Battery Sales & Distribution
              </span>
            ) : (
              <span>Enterprise Workspace</span>
            )}
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-3 uppercase mb-1.5 flex items-center justify-between">
              <span>{group.category}</span>
            </div>
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/app/dashboard" && pathname.startsWith(`${link.href}/`)) ||
                (link.href.includes("?tab=") && pathname === link.href.split("?")[0]);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Platform Super Admin Quick Links */}
      {isPlatformAdmin && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
          <Link
            href="/super-admin"
            className="flex items-center justify-between p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Super Admin Console</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
          </Link>
          <Link
            href="/platform"
            className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Platform Overview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      )}
    </aside>
  );
}
