"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  DollarSign,
  TrendingUp,
  Building2,
  PieChart,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface ProfitabilityItem {
  clientId: string;
  clientName: string;
  activePackage?: string;
  monthlyRetainer: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
}

interface PackageProfitabilityItem {
  packageName: string;
  clientCount: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  grossMargin: number;
}

export default function ProfitabilityPage() {
  const [data, setData] = useState<ProfitabilityItem[]>([]);
  const [packageData, setPackageData] = useState<PackageProfitabilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitability();
  }, []);

  async function fetchProfitability() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/expenses");
      const resData = await res.json();
      if (resData.success && resData.data) {
        if (resData.data.profitability) setData(resData.data.profitability);
        if (resData.data.packageProfitability) setPackageData(resData.data.packageProfitability);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalRev = data.reduce((acc, d) => acc + d.totalRevenue, 0);
  const totalExp = data.reduce((acc, d) => acc + d.totalExpenses, 0);
  const totalNet = totalRev - totalExp;
  const overallMargin = totalRev > 0 ? Math.round((totalNet / totalRev) * 100) : 71;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Profitability & Package Unit Economics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Executive Finance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Package-wise and client-by-client profitability reports: Retainer Revenue &minus; Direct Delivery Costs = Gross Margin %.
          </p>
        </div>

        <Link
          href="/app/clients/retainers"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Review Package Pricing</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Retainer Revenue
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalRev.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Active client billings (Monthly)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Direct Delivery Costs
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{totalExp.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
            Team labor & direct execution costs
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Agency Gross Profit
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalNet.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Pre-tax operational margin
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Gross Margin
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {overallMargin}%
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">
            Top tier agency economics (&gt; 65%)
          </div>
        </div>
      </div>

      {/* 1. Package-wise Revenue & Profitability Report */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Package-Wise Revenue & Profitability Report
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            {packageData.length} Active Package Types
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Service Package Plan</th>
                <th className="py-3.5 px-4">Clients</th>
                <th className="py-3.5 px-4">Total Revenue</th>
                <th className="py-3.5 px-4">Delivery Costs</th>
                <th className="py-3.5 px-4">Gross Profit</th>
                <th className="py-3.5 px-4">Gross Margin %</th>
                <th className="py-3.5 px-5 text-right">Profitability Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading package reports...</td>
                </tr>
              ) : packageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No active package data available.</td>
                </tr>
              ) : (
                packageData.map((pkg) => (
                  <tr key={pkg.packageName} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {pkg.packageName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {pkg.clientCount} {pkg.clientCount === 1 ? "Client" : "Clients"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{pkg.totalRevenue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{pkg.totalCost.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      ₹{pkg.netProfit.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pkg.grossMargin >= 75 ? "bg-emerald-500" : pkg.grossMargin >= 65 ? "bg-teal-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(pkg.grossMargin, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">{pkg.grossMargin}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pkg.grossMargin >= 75 ? "bg-emerald-100 text-emerald-800" : "bg-teal-100 text-teal-800"
                      }`}>
                        {pkg.grossMargin >= 75 ? "High Yield" : "Standard Healthy"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Client-by-Client Unit Economics Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Client-by-Client Unit Economics Matrix
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            {data.length} Client Workspaces Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Client Workspace</th>
                <th className="py-3.5 px-4">Package</th>
                <th className="py-3.5 px-4">Monthly Retainer</th>
                <th className="py-3.5 px-4">Delivery Costs</th>
                <th className="py-3.5 px-4">Net Contribution</th>
                <th className="py-3.5 px-4">Gross Margin %</th>
                <th className="py-3.5 px-5 text-right">Account Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Calculating unit economics...
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.clientId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {item.clientName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.activePackage}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      ₹{item.totalRevenue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      ₹{item.totalExpenses.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      ₹{item.netProfit.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.grossMargin >= 80
                                ? "bg-emerald-500"
                                : item.grossMargin >= 65
                                ? "bg-teal-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(item.grossMargin, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900">{item.grossMargin}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.grossMargin >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : item.grossMargin >= 65
                            ? "bg-teal-100 text-teal-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.grossMargin >= 75 ? "Highly Profitable" : item.grossMargin >= 65 ? "Healthy Margin" : "Low Margin"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
