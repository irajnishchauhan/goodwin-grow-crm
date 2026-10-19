"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gauge,
  User,
  Users2,
  Building2,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface TeamMemberWorkload {
  name: string;
  role: string;
  avatar: string;
  assignedClients: string[];
  activeTasksCount: number;
  completedTasksThisMonth: number;
  capacityPercent: number;
  specialization: string;
}

export default function TeamWorkloadPage() {
  const [team] = useState<TeamMemberWorkload[]>([
    {
      name: "Kunal Sharma",
      role: "Senior Account Manager",
      avatar: "KS",
      assignedClients: [
        "Sapna Washing Point",
        "Nikita Shrivastava (Lucky's Hair)",
        "Sumit More Furniture Design",
      ],
      activeTasksCount: 8,
      completedTasksThisMonth: 18,
      capacityPercent: 78,
      specialization: "Client Relationships, Local Business Growth & Account Strategy",
    },
    {
      name: "Ansh Chourasiya",
      role: "Lead Account Manager & Growth Partner",
      avatar: "AC",
      assignedClients: [
        "Maa Amba Foam & Furnishing",
        "FinEdge Neo-Banking & Wealth Technologies",
      ],
      activeTasksCount: 9,
      completedTasksThisMonth: 22,
      capacityPercent: 84,
      specialization: "Enterprise Brand Growth, Retainer Upsells & Multi-Pod Delivery",
    },
    {
      name: "Rohit Kapoor",
      role: "VP Client Growth & Media Buying",
      avatar: "RK",
      assignedClients: [
        "ZestPure Omnichannel D2C Nutrition",
        "Mahalaxmi Heritage Jewellers Group",
      ],
      activeTasksCount: 12,
      completedTasksThisMonth: 34,
      capacityPercent: 92,
      specialization: "Meta & Google Ad Algorithms, ROAS Optimization & Scaled Media",
    },
    {
      name: "Pooja Verma",
      role: "Lead Visual & Motion Designer",
      avatar: "PV",
      assignedClients: [
        "Sapna Washing Point",
        "ZestPure Wellness",
        "Nikita Shrivastava",
      ],
      activeTasksCount: 14,
      completedTasksThisMonth: 38,
      capacityPercent: 88,
      specialization: "High-Engagement Instagram Reels, 3D Product Renders & Carousels",
    },
    {
      name: "Deepak Joshi",
      role: "Senior Art Director",
      avatar: "DJ",
      assignedClients: [
        "Maa Amba Foam & Furnishing",
        "FinEdge App",
        "Mahalaxmi Jewels",
      ],
      activeTasksCount: 11,
      completedTasksThisMonth: 29,
      capacityPercent: 75,
      specialization: "Luxury Brand Identity, Typography, Color Theory & Ad Creatives",
    },
    {
      name: "Aman Gupta",
      role: "Senior Copywriter & Hook Strategist",
      avatar: "AG",
      assignedClients: [
        "Sapna Washing Point",
        "ZestPure Wellness",
        "Mahalaxmi Jewels",
      ],
      activeTasksCount: 10,
      completedTasksThisMonth: 31,
      capacityPercent: 70,
      specialization: "Viral Scriptwriting, Direct-Response Copy & Regional Vernacular Hooks",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agency Team Workload & Capacity
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Pod Allocation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time capacity tracking across creative directors, account managers, copywriters, and media buyers.
          </p>
        </div>

        <Link
          href="/app/settings?tab=team"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <Users2 className="w-4 h-4 text-emerald-600" />
          <span>Manage Team Roster</span>
        </Link>
      </div>

      {/* Capacity Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Active Tasks
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            64 Deliverables
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Distributed across 6 agency specialists
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completed This Month
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            173 Deliverables
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            94% on-time client delivery rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Pod Capacity
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            81% Utilized
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Optimal bandwidth for 2 new client onboardings
          </div>
        </div>
      </div>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                    <div className="text-[11px] text-emerald-700 font-medium">{member.role}</div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.capacityPercent >= 90
                      ? "bg-rose-100 text-rose-800"
                      : member.capacityPercent >= 80
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {member.capacityPercent}% Load
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Current Bandwidth</span>
                  <span>{member.activeTasksCount} active / {member.completedTasksThisMonth} done</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      member.capacityPercent >= 90
                        ? "bg-rose-500"
                        : member.capacityPercent >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${member.capacityPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                    Assigned Client Accounts ({member.assignedClients.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.assignedClients.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Specialization
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {member.specialization}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Pod Status: Ready</span>
              <Link
                href={`/app/tasks`}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 group"
              >
                <span>View Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
