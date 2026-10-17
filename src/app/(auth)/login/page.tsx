"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, Building2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      if (data.data.redirectTo) {
        window.location.href = data.data.redirectTo;
      } else {
        window.location.href = "/app/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-4 ring-1 ring-white/20">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Goodwin Grow <span className="text-emerald-400 font-extrabold">CRM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Multi-Tenant Enterprise SaaS by Goodwin Grow AI
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access your isolated CRM workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Credentials</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("superadmin@goodwingrowai.com", "GoodwinAdmin@2026!")}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                      Platform Super Admin
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      superadmin@goodwingrowai.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  Super Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("admin@goodwinbatteries.com", "CompanyAdmin@2026!")}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                      Goodwin Batteries (Tenant 2 Admin)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      admin@goodwinbatteries.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                  Tenant 2
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("admin@sapnawashing.com", "SapnaAdmin@2026!")}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-200 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                      Sapna Washing Point (Tenant 3 Admin)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      admin@sapnawashing.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                  Tenant 3
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Goodwin Grow CRM &copy; {new Date().getFullYear()} Goodwin Grow AI. All rights reserved.
        </div>
      </div>
    </div>
  );
}
