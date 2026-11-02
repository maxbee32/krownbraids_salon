// app/pending/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type Status = "PENDING_APPROVAL" | "REJECTED" | "ACTIVE" | "UNKNOWN";

const PENDING_STATUSES = ["PENDING_APPROVAL", "PENDING", "REVIEW"];
const ACTIVE_STATUSES = ["ACTIVE", "APPROVED", "COMPLETED"];
const REJECTED_STATUSES = ["REJECTED", "DECLINED"];

export default function PendingApprovalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("UNKNOWN");
  const [checking, setChecking] = useState(false);
  const [salonName, setSalonName] = useState<string>("");
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("setupSalonId");
    localStorage.removeItem("setupBusinessData");
    localStorage.removeItem("setupSelectedPlanId");
    localStorage.removeItem("setupStep");
    localStorage.removeItem("paymentStatus");
    localStorage.removeItem("checkoutId");
    router.push("/login");
  };

  const checkStatus = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const onboardingRes = await fetch(
        "/api/auth/business/salons/onboarding",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!onboardingRes.ok) {
        // Safe default: assume pending rather than leaving user stranded
        if (onboardingRes.status === 404) {
          router.push("/dashboard/setup");
          return;
        }
        setCheckError("Couldn't load your application. Try again shortly.");
        return;
      }

      const onboarding = await onboardingRes.json();
      const salonId = onboarding.salonId ?? onboarding.id;
      if (!salonId) {
        // No salon at all → they never finished setup
        router.push("/dashboard/setup");
        return;
      }

      const detailsRes = await fetch(
        `/api/auth/business/salons/${salonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!detailsRes.ok) {
        setCheckError("Couldn't check your status. Try again shortly.");
        return;
      }

      const details = await detailsRes.json();
      const salon = details.data || details;
      setSalonName(salon.name || "");

      if (ACTIVE_STATUSES.includes(salon.status)) {
        setStatus("ACTIVE");
        router.push("/dashboard");
      } else if (REJECTED_STATUSES.includes(salon.status)) {
        setStatus("REJECTED");
      } else if (PENDING_STATUSES.includes(salon.status)) {
        setStatus("PENDING_APPROVAL");
      } else {
        // Unknown status (DRAFT, null, etc.) → back to setup
        router.push("/dashboard/setup");
      }
    } catch (err) {
      console.error("Status check failed:", err);
      setCheckError("Couldn't check status right now. Try again in a moment.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: auto-refresh every 60s while the tab is visible
  useEffect(() => {
    if (status === "ACTIVE" || status === "REJECTED") return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    }, 60_000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background image */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>
      </div>

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Brand */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                KROWN
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  BRAIDS
                </span>
              </span>
            </div>
            <p className="text-cyan-300/70 text-[11px] tracking-[0.3em] uppercase font-semibold">
              Application status
            </p>
          </div>

          {/* Card */}
          <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

            <div
              className="relative p-8 text-center"
              role="status"
              aria-live="polite"
            >
              {status === "REJECTED" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center mx-auto mb-4">
                    <XCircleIcon className="h-8 w-8 text-red-400" />
                  </div>
                  <h1 className="text-xl font-bold text-white">
                    Application not approved
                  </h1>
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">
                    Unfortunately your salon application wasn&apos;t approved.
                    Please contact our support team and we&apos;ll help you
                    resolve any issues.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-2">
                    <a
                      href="mailto:support@krownbraids.com"
                      className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition"
                    >
                      Contact support
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="h-8 w-8 text-amber-400" />
                  </div>

                  <h1 className="text-xl font-bold text-white">
                    {salonName
                      ? `${salonName} is under review`
                      : "Your salon is under review"}
                  </h1>

                  <p className="text-white/50 text-sm mt-2 leading-relaxed max-w-md mx-auto">
                    Thanks for completing your setup! Our team is reviewing
                    your business details. This usually takes 24&ndash;48
                    hours &mdash; you&apos;ll receive an email as soon as your
                    account is active.
                  </p>

                  {checkError && (
                    <div
                      role="alert"
                      className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <p className="text-red-300 text-xs">{checkError}</p>
                    </div>
                  )}

                  <div className="mt-7 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={checkStatus}
                      disabled={checking}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <ArrowPathIcon
                        className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
                      />
                      {checking ? "Checking…" : "Check status"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}

              {/* Footer reassurance */}
              {status !== "REJECTED" && (
                <div className="mt-8 pt-6 border-t border-white/[0.06] text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/50 text-xs leading-relaxed">
                      <span className="text-white/70 font-medium">
                        Setup complete.
                      </span>{" "}
                      Your business info, plan and payment details are all
                      saved.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/50 text-xs leading-relaxed">
                      <span className="text-white/70 font-medium">
                        Why review?
                      </span>{" "}
                      We verify every salon to keep KrownBraids trustworthy for
                      clients.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
            KrownBraids · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}