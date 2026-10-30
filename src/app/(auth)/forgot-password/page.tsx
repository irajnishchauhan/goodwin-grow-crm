"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  // Query param token detection
  const [token, setToken] = useState<string | null>(null);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);

  // Request Reset Link State
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestResult, setRequestResult] = useState<{
    message: string;
    resetUrl: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Set New Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenVal = params.get("token");
      if (tokenVal) {
        setToken(tokenVal);
        setVerifyingToken(true);
        verifyToken(tokenVal);
      }
    }
  }, []);

  async function verifyToken(tokenVal: string) {
    try {
      const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(tokenVal)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTokenError(data.error || "This password reset link is invalid or has expired.");
      } else {
        setTargetEmail(data.email);
      }
    } catch {
      setTokenError("Failed to verify reset link. Please check your internet connection.");
    } finally {
      setVerifyingToken(false);
    }
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process password reset request.");
      }

      setRequestResult({
        message: data.message,
        resetUrl: data.resetUrl,
        email: data.email,
      });
    } catch (err: any) {
      setRequestError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmittingPassword(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password.");
      }

      setPasswordSuccess(true);
    } catch (err: any) {
      setPasswordError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmittingPassword(false);
    }
  }

  function handleCopy() {
    if (!requestResult) return;
    const fullUrl = `${window.location.origin}${requestResult.resetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-4 ring-1 ring-white/20 hover:scale-105 transition"
          >
            <Layers className="w-7 h-7" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Goodwin Grow <span className="text-emerald-400 font-extrabold">CRM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Self-Service Account Recovery
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          {/* VIEW A: Token Verifying State */}
          {verifyingToken ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500">Verifying secure reset link...</p>
            </div>
          ) : token ? (
            /* VIEW B: Reset Token Present (Set New Password) */
            tokenError ? (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Reset Link Invalid or Expired</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{tokenError}</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setToken(null);
                      setTokenError(null);
                      if (typeof window !== "undefined") {
                        window.history.replaceState({}, "", "/forgot-password");
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Request a New Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : passwordSuccess ? (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Password Updated!</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Your account password has been updated successfully. You can now sign in with your new credentials.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login?reset=success"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Set New Password</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Updating account credentials for <strong className="text-slate-800">{targetEmail}</strong>.
                  </p>
                </div>

                {passwordError && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submittingPassword ? "Updating Password..." : "Save New Password"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            )
          ) : /* VIEW C: Request Reset Link Form */
          !requestResult ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Forgot your password?</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered work email and we will generate a secure reset link to update your account password.
                </p>
              </div>

              {requestError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {requestError}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Work Email
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

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <span>{requestLoading ? "Verifying Account..." : "Generate Reset Link"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Reset Link Ready</h2>
                  <p className="text-xs text-slate-500">Authorized for {requestResult.email}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {requestResult.message}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(requestResult.resetUrl.split("?")[1]);
                      const tokenVal = params.get("token");
                      if (tokenVal) {
                        setToken(tokenVal);
                        setVerifyingToken(true);
                        verifyToken(tokenVal);
                        if (typeof window !== "undefined") {
                          window.history.pushState({}, "", requestResult.resetUrl);
                        }
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer text-center"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Set New Password Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? "Reset Link Copied!" : "Copy Reset Link"}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                This secure reset link is valid for 1 hour.
              </p>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Goodwin Grow CRM &copy; {new Date().getFullYear()} Goodwin Grow AI. All rights reserved.
        </div>
      </div>
    </div>
  );
}
