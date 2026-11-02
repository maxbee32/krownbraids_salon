// app/reset-password/page.tsx
"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const firstOtpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  // Auto-focus the first OTP box on mount
  useEffect(() => {
    if (!success && firstOtpRef.current) {
      firstOtpRef.current.focus();
    }
  }, [success]);

  /* ---------- OTP handlers ---------- */

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 3) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, 4);

    if (digits.length === 4) {
      setOtp(digits.split(""));
      const lastInput = document.getElementById("reset-otp-3");
      if (lastInput) (lastInput as HTMLInputElement).focus();
    }
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length < 4) {
      setError("Please enter the complete 4-digit reset code");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpCode,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
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
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-display text-2xl font-extrabold text-white tracking-tight">
                KROWN
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  BRAIDS
                </span>
              </span>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Password reset
                </h2>
                <p className="text-white/60 text-sm">
                  Your password has been updated.
                  <br />
                  <span className="text-white/40 text-xs">
                    Redirecting to login…
                  </span>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-cyan-500/10">
                      <KeyIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Reset your password
                  </h1>
                  <p className="text-white/40 text-sm">
                    Enter the code we sent to{" "}
                    <strong className="text-white/60">{email || "your email"}</strong>
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
                  {!emailFromQuery && (
                    <div>
                      <label className="block text-white/40 text-xs font-medium mb-1.5 tracking-wide">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      />
                    </div>
                  )}

                  {/* 🔑 4-box OTP input */}
                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-3 text-center tracking-wide">
                      RESET CODE
                    </label>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`reset-otp-${index}`}
                          ref={index === 0 ? firstOtpRef : undefined}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          className="w-14 h-16 text-center bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all hover:border-white/20"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    <p className="text-white/20 text-xs text-center mt-2">
                      Enter the 4-digit code sent to your email
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-1.5 tracking-wide">
                      NEW PASSWORD
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-1.5 tracking-wide">
                      CONFIRM PASSWORD
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
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
                          <span>Resetting…</span>
                        </>
                      ) : (
                        <>
                          <span>Reset password</span>
                          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/60 text-sm transition-colors"
                  >
                    Didn&apos;t receive a code? Resend
                  </Link>
                  <div>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/60 text-sm transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Back to sign in
                    </Link>
                  </div>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
            <p className="text-white/40 mt-4 text-sm">Loading…</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}