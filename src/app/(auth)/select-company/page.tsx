"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Layers, LogOut } from "lucide-react";

export default function SelectCompanyPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMemberships(data.data.memberships || []);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(tenantId: string) {
    try {
      setSwitching(true);
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (res.ok) {
        window.location.href = "/app/dashboard";
      } else {
        alert("Failed to switch company workspace");
      }
    } catch {
      alert("Error switching workspace");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Select Company Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Your account has access to multiple client companies. Select one to proceed.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading workspaces...</div>
          ) : (
            memberships.map((m) => (
              <button
                key={m.tenantId}
                disabled={switching}
                onClick={() => handleSelect(m.tenantId)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 flex items-center justify-center font-bold text-sm transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-950">
                      {m.tenantName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {m.tenantCode} {m.isOwner ? "• Owner" : "• Member"}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
              </button>
            ))
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
