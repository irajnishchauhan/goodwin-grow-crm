"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  FileCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ProposalItem {
  id: string;
  proposalNumber: string;
  clientProspect: string;
  serviceTier: string;
  monthlyRetainer: number;
  totalAnnualValue: number;
  status: "ACCEPTED" | "SENT" | "DRAFT" | "CONVERTED";
  createdDate: string;
  winProbability: number;
}

export default function ProposalsPage() {
  const [proposals] = useState<ProposalItem[]>([
    {
      id: "1",
      proposalNumber: "PROP-GGA-2026-042",
      clientProspect: "ZestPure Omnichannel D2C Nutrition",
      serviceTier: "Goodwin Hyper-Growth Performance Retainer",
      monthlyRetainer: 280000,
      totalAnnualValue: 3360000,
      status: "CONVERTED",
      createdDate: "2026-09-20",
      winProbability: 100,
    },
    {
      id: "2",
      proposalNumber: "PROP-GGA-2026-043",
      clientProspect: "Sapna Washing Point",
      serviceTier: "Growth Retainer (Social + Local SEO)",
      monthlyRetainer: 50000,
      totalAnnualValue: 600000,
      status: "CONVERTED",
      createdDate: "2026-09-25",
      winProbability: 100,
    },
    {
      id: "3",
      proposalNumber: "PROP-GGA-2026-044",
      clientProspect: "Maa Amba Foam & Furnishing",
      serviceTier: "Enterprise Creative & Meta Ads Retainer",
      monthlyRetainer: 100000,
      totalAnnualValue: 1200000,
      status: "CONVERTED",
      createdDate: "2026-09-28",
      winProbability: 100,
    },
    {
      id: "4",
      proposalNumber: "PROP-GGA-2026-045",
      clientProspect: "NovaCare Ayurvedic Personal Care",
      serviceTier: "Hyper-Growth D2C Meta & Creator Pod",
      monthlyRetainer: 180000,
      totalAnnualValue: 2160000,
      status: "SENT",
      createdDate: "2026-10-12",
      winProbability: 75,
    },
    {
      id: "5",
      proposalNumber: "PROP-GGA-2026-046",
      clientProspect: "UrbanCraft Modern Furniture",
      serviceTier: "Starter Digital Presence & Local Leads",
      monthlyRetainer: 30000,
      totalAnnualValue: 360000,
      status: "DRAFT",
      createdDate: "2026-10-17",
      winProbability: 50,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Proposals & Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Sales-to-Client Handoff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build high-converting agency proposals from service catalogs, track prospect approvals, and convert won deals into active client workspaces.
          </p>
        </div>

        <Link
          href="/app/quotations"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>CRM Quotations</span>
        </Link>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 gap-4">
        {proposals.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {item.proposalNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === "CONVERTED"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "SENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.status === "CONVERTED" ? "Converted to Client" : item.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {item.clientProspect}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  <span className="font-semibold text-emerald-700">{item.serviceTier}</span>
                  <span>• Created: {item.createdDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Monthly Retainer</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    ₹{item.monthlyRetainer.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-slate-400"> /mo</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Annual Contract Value</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    ₹{(item.totalAnnualValue / 100000).toFixed(1)} Lakhs
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-medium">Win Probability</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">
                    {item.winProbability}%
                  </div>
                </div>
              </div>
            </div>

            {item.status === "CONVERTED" && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Onboarded into active agency delivery workspace.</span>
                </span>
                <Link
                  href="/app/clients"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Open Client 360° View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
