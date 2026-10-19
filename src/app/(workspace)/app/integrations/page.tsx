"use client";

import { useState } from "react";
import {
  Puzzle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Share2,
  Search,
  MessageSquare,
  CreditCard,
  HardDrive,
  Mail,
  Calendar,
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  description: string;
  iconBg: string;
  status: "CONNECTED" | "AVAILABLE" | "CONFIGURING";
  lastSync: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "meta",
      name: "Meta Marketing & Instagram Graph API",
      category: "Paid Ads & Social Publishing",
      description: "Direct connection to Meta Business Manager, automated lead ads ingestion, and Instagram post scheduling.",
      iconBg: "bg-blue-600",
      status: "CONNECTED",
      lastSync: "Synced 4 mins ago",
    },
    {
      id: "google-ads",
      name: "Google Ads & Analytics API",
      category: "Search & Conversion Tracking",
      description: "Syncs Google Search conversions, Performance Max ROAS, keyword CPCs, and GA4 website analytics.",
      iconBg: "bg-emerald-600",
      status: "CONNECTED",
      lastSync: "Synced 12 mins ago",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business Cloud API",
      category: "Conversational MarTech",
      description: "Real-time lead qualification chatbot, automated WhatsApp greeting on lead capture, and payment link delivery.",
      iconBg: "bg-emerald-700",
      status: "CONNECTED",
      lastSync: "Real-time webhook active",
    },
    {
      id: "google-drive",
      name: "Google Drive Creative Assets Storage",
      category: "Cloud Media Assets",
      description: "Sync raw client video footage, high-res brand kits, vector logos, and 4K video exports.",
      iconBg: "bg-amber-600",
      status: "CONNECTED",
      lastSync: "Synced 1 hr ago",
    },
    {
      id: "razorpay",
      name: "Razorpay / Stripe Payment Gateway",
      category: "Billing & UPI Settlements",
      description: "Automated recurring retainer subscriptions, instant UPI invoice links, and verified payment reconciliation.",
      iconBg: "bg-indigo-600",
      status: "CONNECTED",
      lastSync: "Webhooks active",
    },
    {
      id: "google-workspace",
      name: "Gmail & Google Calendar",
      category: "Communication & Meetings",
      description: "Sync client strategy calls, onboarding meetings, and automated email follow-ups with read receipts.",
      iconBg: "bg-rose-600",
      status: "CONNECTED",
      lastSync: "Synced 3 mins ago",
    },
    {
      id: "goodwin-erp",
      name: "Goodwin Batteries ERP & Manufacturing System",
      category: "Enterprise Resource Planning (ERP Boundary)",
      description: "Bidirectional sync: Pushes approved dealer orders from CRM to ERP; pulls GST e-Way bills, inventory availability, and ledger settlements from ERP.",
      iconBg: "bg-amber-600",
      status: "CONNECTED",
      lastSync: "Active REST Webhook (Idempotent)",
    },
    {
      id: "warranty-engine",
      name: "Goodwin Authorized Digital Warranty Engine",
      category: "Warranty & Serial Authentication",
      description: "Direct validation against production serial database, hydrometer specific gravity thresholds, and automated replacement serial allocation.",
      iconBg: "bg-emerald-600",
      status: "CONNECTED",
      lastSync: "Verified & Connected",
    },
  ]);

  function toggleConnection(id: string) {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "CONNECTED" ? "AVAILABLE" : "CONNECTED",
              lastSync: "Just now",
            }
          : item
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency API Integrations & Webhooks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Official Partner APIs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connect Meta Business Manager, Google Ads, WhatsApp Business, Google Drive, and Razorpay payment gateways.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${item.iconBg} text-white flex items-center justify-center font-black shadow-sm`}
                >
                  <Puzzle className="w-6 h-6" />
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === "CONNECTED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {item.category}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{item.lastSync}</span>
              </span>

              <button
                onClick={() => toggleConnection(item.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                  item.status === "CONNECTED"
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {item.status === "CONNECTED" ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
