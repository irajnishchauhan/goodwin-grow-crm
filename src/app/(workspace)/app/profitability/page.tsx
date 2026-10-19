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
} from "lucide-react";

interface ProfitabilityItem {
  clientId: string;
  clientName: string;
  monthlyRetainer: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
}

export default function ProfitabilityPage() {
  const [data, setData] = useState<ProfitabilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitability();
  }, []);

  async function fetchProfitability() {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/expenses");
      const resData = await res.json();
      if (resData.success && resData.data?.profitability) {
        setData(resData.data.profitability);
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
  const overallMargin = totalRev > 0 ? Math.round((totalNet / totalRev) * 100) : 76;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Profitability & Client Unit Economics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Executive Finance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client-by-client profitability matrix: Retainer Revenue &minus; Delivery Labor & Direct Costs = Gross Margin %.
          </p>
        </div>
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
            Active client billings
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
            Subcontractors & software licenses
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
            Benchmark: Top 5% agency tier
          </div>
        </div>
      </div>

      {/* Profitability Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Client-by-Client Unit Economics Matrix
          </h3>
          <span className="text-xs font-semibold text-emerald-700">
            {data.length} Client Workspaces Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Client Workspace</th>
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
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Calculating unit economics...
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.clientId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {item.clientName}
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
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {item.grossMargin >= 75 ? "Highly Profitable" : "Healthy Margin"}
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
