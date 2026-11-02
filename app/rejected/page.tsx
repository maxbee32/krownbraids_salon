// app/(auth)/rejected/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface SalonInfo {
  id: number;
  name: string;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
}

export default function RejectedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // Fetch the onboarding record to get the salon id
        const onboardingRes = await fetch(
          "/api/auth/business/salons/onboarding",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!onboardingRes.ok) {
          setError("Could not load your application");
          setLoading(false);
          return;
        }

        const onboarding = await onboardingRes.json();
        const salonId = onboarding.salonId || onboarding.id;

        if (!salonId) {
          // Nothing to show — send them back to the dashboard
          router.replace("/dashboard");
          return;
        }

        // Fetch the full salon to get the reason
        const salonRes = await fetch(
          `/api/auth/business/salons/${salonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!salonRes.ok) {
          setError("Could not load your salon");
          setLoading(false);
          return;
        }

        const data = await salonRes.json();
        const full = data.data || data;

        setSalon({
          id: full.id,
          name: full.name || "Your salon",
          rejectionReason: full.rejectionReason ?? null,
          rejectedAt: full.rejectedAt ?? null,
        });
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    router.replace("/login");
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm font-medium">
            Loading your application
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */

  if (error) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4">
        <div className="relative max-w-md w-full backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <XCircleIcon className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            We couldn&apos;t load your application
          </h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Page ---------- */

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-lg font-bold tracking-tight text-white">
                KROWN
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  BRAIDS
                </span>
              </span>
            </div>
            <p className="text-red-300/70 text-[11px] tracking-[0.3em] uppercase font-semibold">
              Application update
            </p>
          </div>

          {/* Main card */}
          <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent" />

            <div className="relative p-8 md:p-10">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                </div>
              </div>

              {/* Headline */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Application not approved
                </h1>
                <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">
                  We were unable to approve{" "}
                  <span className="text-white/80 font-medium">
                    {salon?.name || "your salon"}
                  </span>{" "}
                  at this time.
                </p>
              </div>

              {/* Reason */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
                <p className="text-[10px] uppercase tracking-wider text-red-300 font-semibold mb-2">
                  Reason
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  {salon?.rejectionReason?.trim() ||
                    "No specific reason was provided. This is often due to incomplete business information or details we couldn't verify."}
                </p>
                {salon?.rejectedAt && (
                  <p className="text-[11px] text-white/40 mt-3">
                    Reviewed on {new Date(salon.rejectedAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                )}
              </div>

              {/* What you can do */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">
                      What you can do
                    </p>
                    <ul className="space-y-1.5 mt-2">
                      {[
                        "Review the reason above and update your details",
                        "Contact our team if you have questions",
                        "Reapply once the issue is resolved",
                      ].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-white/60"
                        >
                          <span className="w-1 h-1 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/dashboard/support")}
                  className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    Contact support
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button
                  onClick={() => router.push("/dashboard/setup")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Update my details
                </button>
              </div>
            </div>
          </div>

          {/* Footer — back to login */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>

          <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
            KrownBraids · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}