// app/payment/callback/page.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        let checkoutId = searchParams.get("checkoutId");
        const statusParam = searchParams.get("status");
        const salonIdParam = searchParams.get("salonId");
        const planIdParam = searchParams.get("planId");
        const sessionId = searchParams.get("sessionId");

        if (!checkoutId) {
          checkoutId = localStorage.getItem("checkoutId");
        }

        if (!checkoutId && sessionId) {
          checkoutId = sessionId;
        }

        // Handle cancellation
        if (statusParam === "cancel" || statusParam === "CANCELLED") {
          setStatus("error");
          setMessage("Payment was cancelled. You can try again from setup.");
          setTimeout(() => router.push("/dashboard/setup"), 3000);
          return;
        }

        if (!checkoutId) {
          setStatus("error");
          setMessage("No payment reference found. Please contact support.");
          setTimeout(() => router.push("/dashboard/setup"), 3000);
          return;
        }

        const response = await fetch(`/api/auth/payment/verify/${checkoutId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        const isPaid =
          data.success === true ||
          data.paid === true ||
          data.status === "SUCCESS" ||
          data.status === "PAID" ||
          data.status === "success" ||
          data.status === "PAYMENT_RECEIVED" ||
          data.status === "COMPLETED";

        if (isPaid) {
          setStatus("success");
          setMessage("Payment received. Redirecting to review…");

          const salonId = salonIdParam || localStorage.getItem("setupSalonId");
          const planId =
            planIdParam || localStorage.getItem("setupSelectedPlanId");

          try {
            await fetch("/api/auth/business/salons/onboarding", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                currentStep: 3,
                step: "REVIEW",
                completed: false,
                salonId,
                selectedPlanId: planId,
              }),
            });
          } catch (error) {
            console.warn("Failed to update onboarding:", error);
          }

          localStorage.setItem("setupStep", "3");
          localStorage.setItem("paymentStatus", "success");
          localStorage.removeItem("checkoutId");

          setTimeout(() => router.push("/dashboard/setup"), 2000);
        } else {
          setStatus("error");
          setMessage(
            `Payment status: ${data.status || "unknown"}. Please contact support.`
          );
          setTimeout(() => router.push("/dashboard/setup"), 3000);
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage("We couldn't verify your payment. Please contact support.");
        setTimeout(() => router.push("/dashboard/setup"), 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background */}
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
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
        </div>
      </div>

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-6">
            <span className="text-lg font-bold tracking-tight text-white">
              KROWN
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                BRAIDS
              </span>
            </span>
          </div>

          <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

            <div className="relative p-8 md:p-10 text-center">
              {/* Processing */}
              {status === "processing" && (
                <>
                  <div className="relative mx-auto mb-6">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-cyan-400" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-purple-300/30 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Verifying payment
                  </h2>
                  <p className="text-white/50 text-sm">{message}</p>
                  <p className="text-white/30 text-xs mt-4">
                    Please don&apos;t close this window.
                  </p>
                </>
              )}

              {/* Success */}
              {status === "success" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Payment received
                  </h2>
                  <p className="text-white/50 text-sm">{message}</p>

                  <div className="mt-6 flex items-center justify-center gap-2 text-cyan-300 text-xs">
                    <span>Redirecting to review</span>
                    <ArrowRightIcon className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                </>
              )}

              {/* Error */}
              {status === "error" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <XCircleIcon className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Payment not completed
                  </h2>
                  <p className="text-white/50 text-sm mb-6">{message}</p>

                  <button
                    onClick={() => router.push("/dashboard/setup")}
                    className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
                  >
                    <span className="relative z-10">Return to setup</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  <p className="text-white/30 text-xs mt-4">
                    Redirecting automatically in a few seconds…
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
            Secure payment · KrownBraids
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page wrapper                                                       */
/* ------------------------------------------------------------------ */

export default function PaymentCallback() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

          <div className="relative z-10 text-center">
            <div className="relative mx-auto">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-cyan-400" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-purple-300/30 animate-pulse" />
            </div>
            <p className="text-white/40 mt-4 text-sm font-medium">Loading…</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}