"use client";

import { useState, useEffect } from "react";
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
  Cpu,
  Truck,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Database,
  Layers,
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

const DEFAULT_AGENCY_INTEGRATIONS: IntegrationItem[] = [
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
];

const BATTERY_ERP_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "sap-erp",
    name: "SAP S/4HANA & ECC 6.0 Connector",
    category: "Core Manufacturing ERP",
    description: "Bidirectional Sales Order IDOC / RFC sync, factory buffer stock reservation, and automated dispatch hold on credit limit breach.",
    iconBg: "bg-sky-700",
    status: "CONNECTED",
    lastSync: "Live RFC Bridge Active",
  },
  {
    id: "tally-prime",
    name: "Tally Prime & Tally ERP 9 Connector",
    category: "Distribution Accounting & Ledgers",
    description: "Automated XML / ODBC voucher sync for dealer purchase orders, real-time outstanding ledger balance updates, and payment reconciliation.",
    iconBg: "bg-amber-700",
    status: "CONNECTED",
    lastSync: "ODBC Server Connected",
  },
  {
    id: "busy-erp",
    name: "Busy Accounting Software ERP Bridge",
    category: "Wholesale & Sub-Dealer Invoicing",
    description: "Seamless batch export of secondary dealer invoices, SKU barcode validation, and distributor stock replenishment orders.",
    iconBg: "bg-indigo-700",
    status: "CONNECTED",
    lastSync: "Sync Ready",
  },
  {
    id: "gst-eway-bill",
    name: "Government GSTN & E-Way Bill Gateway",
    category: "Statutory Compliance & Logistics",
    description: "Direct NIC e-Invoicing API: automated E-Way Bill generation on battery dispatch, QR code embedding, and IRN acknowledgement.",
    iconBg: "bg-emerald-700",
    status: "CONNECTED",
    lastSync: "NIC API v1.04 Connected",
  },
  {
    id: "logistics-lr",
    name: "Logistics Transporter LR & GPS Tracking",
    category: "Supply Chain & Fleet Tracking",
    description: "Tracks lorry receipts (LR), transporter dispatch manifests (VRL, Safechem, TCI Freight), and delivery confirmation back to CRM orders.",
    iconBg: "bg-orange-600",
    status: "CONNECTED",
    lastSync: "Webhook Listener Active",
  },
  {
    id: "warranty-engine",
    name: "Goodwin Authorized Digital Warranty Engine",
    category: "Warranty & Serial Authentication",
    description: "Direct validation against production serial database, hydrometer specific gravity thresholds, and automated replacement serial allocation.",
    iconBg: "bg-teal-700",
    status: "CONNECTED",
    lastSync: "Verified & Connected",
  },
];

export default function IntegrationsPage() {
  const [isBatteries, setIsBatteries] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(DEFAULT_AGENCY_INTEGRATIONS);
  const [saving, setSaving] = useState(false);
  const [syncingErp, setSyncingErp] = useState(false);
  const [erpStats, setErpStats] = useState<{
    pendingOrders: number;
    syncedOrders: number;
    openWarrantyClaims: number;
    totalPartners: number;
    gatewayStatus: string;
  } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        const isBatt = json?.data?.code === "goodwin-batteries";
        setIsBatteries(isBatt);
        setIntegrations(isBatt ? BATTERY_ERP_INTEGRATIONS : DEFAULT_AGENCY_INTEGRATIONS);

        if (isBatt) {
          fetchErpStats();
        }
      })
      .catch((err) => console.error("Error detecting workspace:", err));
  }, []);

  function fetchErpStats() {
    fetch("/api/batteries/erp-sync")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setErpStats(json.data);
        }
      })
      .catch(() => {});
  }

  async function handleTriggerErpSync(targetErp: "SAP" | "TALLY") {
    setSyncingErp(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/batteries/erp-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_ALL_PENDING", targetErp }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`✅ ${data.message}`);
        fetchErpStats();
      } else {
        setSyncFeedback(`❌ Error: ${data.error || "Failed to synchronize"}`);
      }
    } catch {
      setSyncFeedback("❌ Network error connecting to ERP Gateway");
    } finally {
      setSyncingErp(false);
    }
  }

  async function toggleConnection(id: string) {
    const next: IntegrationItem[] = integrations.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === "CONNECTED" ? "AVAILABLE" : "CONNECTED",
            lastSync: item.status === "CONNECTED" ? "Disconnected" : "Connected just now",
          }
        : item
    );
    setIntegrations(next);

    try {
      setSaving(true);
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrations: next.map((i) => ({ id: i.id, status: i.status, lastSync: i.lastSync })),
        }),
      });
    } catch (err) {
      console.error("Failed to persist integration state to DB:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isBatteries
                ? "Goodwin Batteries ERP & Enterprise Boundary Sync"
                : "Agency API Integrations & Webhooks"}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isBatteries
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isBatteries ? "SAP • Tally • Busy • GST e-Way Bill" : "Official Partner APIs"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isBatteries
              ? "Bidirectional ERP integration bridge: sync approved dealer purchase orders, generate GST e-Way bills, ingest transporter LR status, and reconcile partner ledger balances."
              : "Connect Meta Business Manager, Google Ads, WhatsApp Business, Google Drive, and Razorpay payment gateways."}
          </p>
        </div>

        {isBatteries && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerErpSync("SAP")}
              disabled={syncingErp}
              className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingErp ? "animate-spin" : ""}`} />
              <span>Sync with SAP S/4HANA</span>
            </button>
            <button
              onClick={() => handleTriggerErpSync("TALLY")}
              disabled={syncingErp}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sync with Tally Prime</span>
            </button>
          </div>
        )}
      </div>

      {isBatteries && erpStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending ERP Validation
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {erpStats.pendingOrders} Orders
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Queued in synchronization buffer</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Synced & Dispatched
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {erpStats.syncedOrders} Orders
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ERP Sales Orders posted</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Warranty Credit Memos
            </div>
            <div className="text-2xl font-black text-sky-600 mt-1">
              {erpStats.openWarrantyClaims} Claims
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting credit note in ERP</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Channel Ledgers
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {erpStats.totalPartners} Partners
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dealers, Distributors, Retailers</div>
          </div>
        </div>
      )}

      {syncFeedback && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
          <span>{syncFeedback}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
