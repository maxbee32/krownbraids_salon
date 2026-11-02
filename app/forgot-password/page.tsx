// app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  EnvelopeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset code");
      }

      setSent(true);

      // Redirect to reset page after a short delay so they see "sent"
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="p-8 md:p-10">
            {/* Brand */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-display text-2xl font-extrabold text-white tracking-tight">
                KROWN
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  BRAIDS
                </span>
              </span>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Check your email
                </h2>
                <p className="text-white/60 text-sm">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a
                  reset code.
                  <br />
                  <span className="text-white/40 text-xs">
                    Redirecting to reset page…
                  </span>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-cyan-500/10">
                      <EnvelopeIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Forgot password?
                  </h1>
                  <p className="text-white/40 text-sm">
                    Enter your email and we&apos;ll send you a code to reset your
                    password.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2"
                  >
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400/60 hover:text-red-400"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-1.5 tracking-wide">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.co.uk"
                        required
                        autoComplete="email"
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3.5 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <span>Send reset code</span>
                          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/60 text-sm transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 tracking-widest uppercase">
          Secure reset · KrownBraids
        </p>
      </div>
    </div>
  );
}