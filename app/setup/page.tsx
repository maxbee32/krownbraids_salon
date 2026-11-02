// app/dashboard/setup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessData {
  name: string;
  description: string;
  email: string;
  phoneNumber: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBookingsPerMonth: number;
  maxServices: number;
  onlineBooking: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  popular: boolean;
  active: boolean;
  trialDays: number;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingState {
  salonId: number | null;
  ownerId: number | null;
  step: string;
  completed: boolean;
  selectedPlanId: number | null;
  businessData: BusinessData | null;
  defaultPlanId: number | null;
  nextStep: string;
  requiresPayment: boolean;
  status?: string;
}

interface Alert {
  type: "success" | "error";
  message: string;
}

interface AddressOption {
  line_1: string;
  line_2: string;
  post_town: string;
  postcode: string;
}

const STEP_INDEX: Record<string, number> = {
  BUSINESS: 0,
  PLAN: 1,
  PAYMENT: 2,
  REVIEW: 3,
  COMPLETED: 3,
};

const STEPS = [
  { id: "business", label: "Business", icon: BuildingOfficeIcon },
  { id: "plan", label: "Plan", icon: CreditCardIcon },
  { id: "payment", label: "Payment", icon: ShieldCheckIcon },
  { id: "review", label: "Review", icon: CheckCircleIcon },
];

const SUBMITTED_STATUSES = ["PENDING_APPROVAL", "APPROVED", "ACTIVE"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [salonId, setSalonId] = useState<number | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    description: "",
    email: "",
    phoneNumber: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "United Kingdom",
    postalCode: "",
  });

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [defaultPlanId, setDefaultPlanId] = useState<number | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [nextStep, setNextStep] = useState<string>("BUSINESS");

  // ── Stripe embedded checkout state ──
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  /* ---------- Data fetching ---------- */

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await fetch("/api/auth/subscription/plan", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const plansArray = Array.isArray(data)
          ? data
          : data.data || data.plans || [];
        setPlans(plansArray);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadOnboardingProgress = async () => {
    try {
      setLoadingOnboarding(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setCurrentStep(0);
        return;
      }

      const response = await fetch("/api/auth/business/salons/onboarding", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: OnboardingState = await response.json();

        const alreadyDone =
          data.step === "COMPLETED" ||
          data.completed === true ||
          SUBMITTED_STATUSES.includes(data.status ?? "");

        if (alreadyDone) {
          router.replace("/pending");
          return;
        }

        if (data.step === "REVIEW" && data.salonId) {
          try {
            const salonRes = await fetch(
              `/api/auth/business/salons/${data.salonId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (salonRes.ok) {
              const salonJson = await salonRes.json();
              const salon = salonJson.data || salonJson;
              if (SUBMITTED_STATUSES.includes(salon.status)) {
                router.replace("/pending");
                return;
              }
            }
          } catch {
            // Non-fatal — continue with normal flow
          }
        }

        setNextStep(data.nextStep || "BUSINESS");
        setRequiresPayment(Boolean(data.requiresPayment));
        setDefaultPlanId(data.defaultPlanId ?? null);

        const stepIdx = STEP_INDEX[data.step] ?? 0;
        setCurrentStep(stepIdx);

        if (data.businessData) {
          setBusinessData(data.businessData);
          localStorage.setItem(
            "setupBusinessData",
            JSON.stringify(data.businessData)
          );
        }

        if (data.salonId) {
          setSalonId(data.salonId);
          localStorage.setItem("setupSalonId", String(data.salonId));
        }

        if (data.selectedPlanId) {
          setSelectedPlanId(data.selectedPlanId);
          localStorage.setItem(
            "setupSelectedPlanId",
            String(data.selectedPlanId)
          );
        } else if (data.defaultPlanId) {
          setSelectedPlanId(null);
        }
      } else if (response.status === 404) {
        setCurrentStep(0);
      }
    } catch (error) {
      console.warn("Error loading onboarding progress:", error);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchPlans();
    loadOnboardingProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("setupSalonId");
    router.push("/login");
  };

  /* ---------- Save onboarding (PUT) ---------- */

  const saveOnboardingProgress = async (
    stepName: string,
    planIdOverride?: number | null
  ): Promise<OnboardingState | null> => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return null;

      const effectivePlanId = planIdOverride ?? selectedPlanId;

      const payload: Record<string, unknown> = {
        salonId,
        step: stepName,
        completed: false,
      };

      if (hasValidBusinessData()) {
        payload.businessData = businessData;
      }

      if (effectivePlanId != null) {
        payload.selectedPlanId = effectivePlanId;
      }

      console.log("[save-onboarding] payload:", JSON.stringify(payload));

      const response = await fetch("/api/auth/business/salons/onboarding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Save onboarding failed:", err);
        return null;
      }

      const data: OnboardingState = await response.json();
      console.log("[save-onboarding] response:", data);

      setNextStep(data.nextStep || stepName);
      setRequiresPayment(Boolean(data.requiresPayment));
      setDefaultPlanId(data.defaultPlanId ?? defaultPlanId);

      if (data.salonId) {
        setSalonId(data.salonId);
        localStorage.setItem("setupSalonId", String(data.salonId));
      }
      if (data.selectedPlanId) {
        setSelectedPlanId(data.selectedPlanId);
        localStorage.setItem(
          "setupSelectedPlanId",
          String(data.selectedPlanId)
        );
      }

      return data;
    } catch (error) {
      console.warn("Error saving onboarding progress:", error);
      return null;
    }
  };

  const hasValidBusinessData = () => {
    return Boolean(
      businessData.name?.trim() ||
        businessData.address?.trim() ||
        businessData.city?.trim()
    );
  };

  /* ---------- Actions ---------- */

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleBusinessSubmit = async () => {
    if (!businessData.name.trim())
      return showAlert("error", "Please enter your salon name");
    if (!businessData.address.trim())
      return showAlert("error", "Please enter your address");
    if (!businessData.city.trim())
      return showAlert("error", "Please enter your city");
    if (!businessData.postalCode.trim())
      return showAlert("error", "Please enter your postcode");

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        showAlert("error", "Please sign in again");
        router.push("/login");
        return;
      }

      const saved = await saveOnboardingProgress("BUSINESS");

      if (saved) {
        showAlert("success", "Business registered successfully.");
        setCurrentStep(STEP_INDEX[saved.nextStep] ?? 1);
      } else {
        showAlert("error", "Failed to register business");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert("error", "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planId: number) => {
    setSelectedPlanId(planId);
    setLoading(true);

    const chosen = plans.find((p) => p.id === planId);
    const chosenIsTrial = chosen
      ? chosen.trialDays > 0 || chosen.monthlyPrice === 0
      : true;

    console.log("[plan-select] chosen:", chosen);
    console.log("[plan-select] chosenIsTrial:", chosenIsTrial);

    try {
      const saved = await saveOnboardingProgress("PLAN", planId);

      if (!saved) {
        showAlert("error", "Failed to save plan");
        return;
      }

      let nextIdx = chosenIsTrial ? 3 : 2;

      const serverIdx = STEP_INDEX[saved.nextStep];
      if (serverIdx != null && serverIdx > nextIdx) {
        nextIdx = serverIdx;
      }

      console.log("[plan-select] advancing to step index:", nextIdx);
      setCurrentStep(nextIdx);

      if (chosenIsTrial) {
        showAlert("success", "Free trial activated — waiting for approval.");
      }
    } catch (error) {
      console.warn("Progress save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Stripe: create session, open embedded form ──
  const handlePayment = async () => {
    if (!selectedPlanId) return showAlert("error", "Please select a plan");

    setPreparing(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token || !salonId) {
        showAlert("error", "Session expired. Please try again.");
        return;
      }

      const response = await fetch("/api/auth/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salonId,
          planId: selectedPlanId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.clientSecret) {
        throw new Error(
          data.message || "Payment initialization failed. Please try again."
        );
      }

      // Persist onboarding state
      await saveOnboardingProgress("PAYMENT");

      // Open embedded checkout
      setClientSecret(data.clientSecret);
      setCheckoutOpen(true);
    } catch (error) {
      console.error("Payment error:", error);
      showAlert(
        "error",
        error instanceof Error
          ? error.message
          : "Payment error. Please try again."
      );
    } finally {
      setPreparing(false);
    }
  };

  // Verify with backend that payment was received by the webhook
  const verifyPaymentAndAdvance = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !salonId) {
      showAlert("error", "Session expired.");
      return;
    }

    setVerifyingPayment(true);
    try {
      // Poll up to 3 times with 1.5s between — gives the webhook time to land
      let salonStatus: string | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`/api/auth/business/salons/${salonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const salon = json.data || json;
          salonStatus = salon.status;

          if (
            salonStatus === "PAYMENT_CONFIRMED" ||
            salonStatus === "PENDING_APPROVAL" ||
            salonStatus === "APPROVED" ||
            salonStatus === "ACTIVE"
          ) {
            break;
          }
        }

        // Wait before retrying
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (
        salonStatus === "PAYMENT_CONFIRMED" ||
        salonStatus === "PENDING_APPROVAL" ||
        salonStatus === "APPROVED" ||
        salonStatus === "ACTIVE"
      ) {
        // Payment confirmed — advance
        setCheckoutOpen(false);
        setClientSecret(null);
        setCurrentStep(3);
        showAlert(
          "success",
          "Payment confirmed! Your salon is now pending approval."
        );
      } else {
        // Webhook may still be processing
        showAlert(
          "error",
          "Payment is still processing. Please wait a moment and try again."
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("error", "Could not verify payment. Please try again.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Called by Stripe onComplete OR by the manual "Continue" button
  const handleCheckoutComplete = async () => {
    await verifyPaymentAndAdvance();
  };

  const goToStep = async (stepIdx: number) => {
    if (stepIdx < 0 || stepIdx >= STEPS.length) return;
    if (stepIdx === 0 && salonId) return;

    setCurrentStep(stepIdx);

    const stepName =
      Object.keys(STEP_INDEX).find((k) => STEP_INDEX[k] === stepIdx) ||
      "BUSINESS";

    if (stepIdx === 0) {
      return;
    }

    await saveOnboardingProgress(stepName);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const isTrialPlan = Boolean(
    selectedPlan &&
      (selectedPlan.trialDays > 0 || selectedPlan.monthlyPrice === 0)
  );

  /* ---------- Loading ---------- */

  if (loadingOnboarding) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 text-center">
          <div className="relative mx-auto">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-cyan-400" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-purple-300/30 animate-pulse" />
          </div>
          <p className="text-white/40 mt-4 text-sm font-medium">
            Loading your progress
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Page ---------- */

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
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

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {alert && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center px-4">
          <div
            role="alert"
            className={`w-full max-w-md rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-2xl p-4 flex items-start gap-3 border ${
              alert.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div
              className={`flex-1 text-sm ${
                alert.type === "success" ? "text-emerald-200" : "text-red-200"
              }`}
            >
              {alert.message}
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-white/40 hover:text-white flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
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
              Salon setup
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
              {currentStep === 0 && "Register your business"}
              {currentStep === 1 && "Choose your plan"}
              {currentStep === 2 && "Complete payment"}
              {currentStep === 3 &&
                (isTrialPlan ? "Free trial active" : "Setup complete")}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {currentStep === 0 && "Tell us about your salon"}
              {currentStep === 1 && "Select the plan that suits your business"}
              {currentStep === 2 && "Secure payment to activate your salon"}
              {currentStep === 3 && "Your salon is now being reviewed"}
            </p>
          </div>

          <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

            <div className="relative p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex items-start justify-between">
                  {STEPS.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.id}
                        className="flex flex-col items-center flex-1 relative"
                      >
                        <button
                          onClick={() => isActive && goToStep(index)}
                          disabled={!isActive}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                            isCurrent
                              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-transparent shadow-lg shadow-purple-500/30"
                              : isActive
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
                              : "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </button>
                        <span
                          className={`text-[10px] mt-2 text-center tracking-wide ${
                            isCurrent
                              ? "text-cyan-300 font-semibold"
                              : isActive
                              ? "text-white/60"
                              : "text-white/25"
                          }`}
                        >
                          {step.label}
                        </span>
                        {index < STEPS.length - 1 && (
                          <div
                            className={`absolute top-5 left-[60%] w-[80%] h-px ${
                              index < currentStep
                                ? "bg-gradient-to-r from-cyan-400/60 to-purple-400/60"
                                : "bg-white/10"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-[360px]">
                {currentStep === 0 && (
                  <BusinessRegistration
                    data={businessData}
                    setData={setBusinessData}
                    onSubmit={handleBusinessSubmit}
                    loading={loading}
                    onLogout={handleLogout}
                  />
                )}

                {currentStep === 1 && (
                  <PlanSelection
                    plans={plans}
                    selectedPlanId={selectedPlanId}
                    defaultPlanId={defaultPlanId}
                    onSelectPlan={handlePlanSelect}
                    loading={plansLoading || loading}
                    onBack={() => goToStep(0)}
                  />
                )}

                {currentStep === 2 && (
                  <PaymentStep
                    selectedPlan={selectedPlan}
                    onPay={handlePayment}
                    loading={loading || preparing}
                    onBack={() => goToStep(1)}
                  />
                )}

                {currentStep === 3 && (
                  <ReviewStep
                    isTrial={isTrialPlan}
                    planName={selectedPlan?.name ?? ""}
                  />
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
            KrownBraids · {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Stripe embedded checkout modal ── */}
      {checkoutOpen && clientSecret && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            if (!verifyingPayment) {
              setCheckoutOpen(false);
              setClientSecret(null);
            }
          }}
        >
          <div
            className="relative w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-neutral-200 bg-white px-5 py-3">
              <h3 className="font-semibold text-neutral-900">
                Complete payment
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!verifyingPayment) {
                    setCheckoutOpen(false);
                    setClientSecret(null);
                  }
                }}
                className="rounded p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
                disabled={verifyingPayment}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-2">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  onComplete: handleCheckoutComplete,
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>

            {/* Fallback — ensures the user can advance even if onComplete doesn't fire */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4">
              <p className="text-xs text-neutral-500 mb-2 text-center">
                Paid already? Click below to confirm and continue.
              </p>
              <button
                onClick={handleCheckoutComplete}
                disabled={verifyingPayment}
                className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingPayment ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying payment…
                  </>
                ) : (
                  "Continue to Review"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Business registration                                     */
/* ------------------------------------------------------------------ */

function BusinessRegistration({
  data,
  setData,
  onSubmit,
  loading,
  onLogout,
}: {
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  onSubmit: () => void;
  loading: boolean;
  onLogout: () => void;
}) {
  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all";
  const inputNoIconClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all";
  const labelClass =
    "block text-white/50 text-[10px] uppercase tracking-wider mb-1.5 font-semibold";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Salon name *</label>
          <div className="relative">
            <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className={inputClass}
              placeholder="Your salon name"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className={`${inputNoIconClass} resize-none`}
            placeholder="A short description of your salon…"
            rows={2}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className={inputClass}
              placeholder="you@salon.co.uk"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="tel"
              value={data.phoneNumber}
              onChange={(e) =>
                setData({ ...data, phoneNumber: e.target.value })
              }
              className={inputClass}
              placeholder="07123 456789"
              disabled={loading}
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Website</label>
          <div className="relative">
            <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="url"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
              className={inputClass}
              placeholder="https://yoursalon.co.uk"
              disabled={loading}
            />
          </div>
        </div>

        <PostcodeAddressFields
          postalCode={data.postalCode}
          address={data.address}
          city={data.city}
          onChange={(patch) => setData({ ...data, ...patch })}
          disabled={loading}
          inputClass={inputClass}
          inputNoIconClass={inputNoIconClass}
          labelClass={labelClass}
        />

        <div className="col-span-2">
          <label className={labelClass}>Country</label>
          <select
            value={data.country}
            onChange={(e) => setData({ ...data, country: e.target.value })}
            className={`${inputNoIconClass} [color-scheme:dark]`}
            disabled={loading}
          >
            <option value="United Kingdom" className="bg-slate-900 text-white">
              United Kingdom
            </option>
          </select>
          <p className="text-white/30 text-[10px] mt-1">
            Currently we only operate in the UK
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/[0.06]">
        <button
          onClick={onLogout}
          type="button"
          className="px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Return to sign in
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Registering…
              </>
            ) : (
              <>Continue to plans</>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Postcode → Address dropdown                                        */
/* ------------------------------------------------------------------ */

function PostcodeAddressFields({
  postalCode,
  address,
  city,
  onChange,
  disabled,
  inputClass,
  inputNoIconClass,
  labelClass,
}: {
  postalCode: string;
  address: string;
  city: string;
  onChange: (patch: {
    postalCode?: string;
    address?: string;
    city?: string;
  }) => void;
  disabled?: boolean;
  inputClass: string;
  inputNoIconClass: string;
  labelClass: string;
}) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const lookupPostcode = async () => {
    const cleaned = postalCode.trim().replace(/\s+/g, "");
    if (!cleaned) {
      setLookupError("Enter a postcode first");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setAddresses([]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_IDEAL_POSTCODES_API_KEY;
      const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(
          cleaned
        )}?api_key=${apiKey}`
      );

      if (!res.ok) {
        setLookupError("Could not find addresses for that postcode");
        return;
      }

      const json = await res.json();
      const results = json?.result ?? [];

      if (!results.length) {
        setLookupError("No addresses found for that postcode");
        return;
      }

      const options: AddressOption[] = results.map((r: any) => ({
        line_1: r.line_1 || "",
        line_2: r.line_2 || "",
        post_town: r.post_town || "",
        postcode: r.postcode || "",
      }));

      setAddresses(options);

      if (options.length === 1) {
        applyAddress(options[0]);
      }
    } catch (err) {
      console.error("Postcode lookup failed:", err);
      setLookupError("Address lookup failed. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const applyAddress = (addr: AddressOption) => {
    onChange({
      address: [addr.line_1, addr.line_2].filter(Boolean).join(", "),
      city: addr.post_town,
      postalCode: addr.postcode,
    });
    setAddresses([]);
    setLookupError(null);
  };

  const selectClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all [color-scheme:dark]";

  const optionClass = "bg-slate-900 text-white";

  return (
    <>
      <div className="col-span-2">
        <label className={labelClass}>Postcode *</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value })}
              onBlur={lookupPostcode}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  lookupPostcode();
                }
              }}
              className={inputClass}
              placeholder="SW1A 1AA"
              disabled={disabled || lookupLoading}
            />
          </div>
          <button
            type="button"
            onClick={lookupPostcode}
            disabled={disabled || lookupLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60 whitespace-nowrap"
          >
            {lookupLoading ? "Searching…" : "Find address"}
          </button>
        </div>
        {lookupError && (
          <p className="text-red-400 text-xs mt-1.5">{lookupError}</p>
        )}
      </div>

      {addresses.length > 0 && (
        <div className="col-span-2">
          <label className={labelClass}>
            Select address * ({addresses.length} found)
          </label>
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx)) applyAddress(addresses[idx]);
            }}
            defaultValue=""
            className={selectClass}
            disabled={disabled}
          >
            <option value="" disabled className={optionClass}>
              Choose an address…
            </option>
            {addresses.map((a, i) => (
              <option key={i} value={i} className={optionClass}>
                {[a.line_1, a.line_2].filter(Boolean).join(", ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {address && (
        <div className="col-span-2">
          <label className={labelClass}>Confirmed address</label>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80">
            {address}
            {city && <span className="text-white/50"> · {city}</span>}
            {postalCode && (
              <span className="text-white/50"> · {postalCode}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Plan selection (block cards)                              */
/* ------------------------------------------------------------------ */

function PlanSelection({
  plans,
  selectedPlanId,
  defaultPlanId,
  onSelectPlan,
  loading,
  onBack,
}: {
  plans: Plan[];
  selectedPlanId: number | null;
  defaultPlanId: number | null;
  onSelectPlan: (id: number) => void;
  loading: boolean;
  onBack: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
        <p className="text-white/40 mt-3 text-sm">Loading plans…</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 text-sm">No plans available</p>
      </div>
    );
  }

  const effectivePlanId = selectedPlanId ?? defaultPlanId;

  const getFeatures = (plan: Plan): string[] => {
    const features: string[] = [];
    if (plan.maxBookingsPerMonth > 0) {
      features.push(`${plan.maxBookingsPerMonth} bookings / month`);
    } else if (plan.maxBookingsPerMonth === 0) {
      features.push("Unlimited bookings");
    }
    if (plan.maxServices > 0) {
      features.push(`${plan.maxServices} active services`);
    } else if (plan.maxServices === 0) {
      features.push("Unlimited services");
    }
    if (plan.onlineBooking) features.push("Online booking");
    if (plan.analytics) features.push("Revenue analytics");
    if (plan.prioritySupport) features.push("Priority support");
    if (plan.customBranding) features.push("Custom branding");
    if (plan.trialDays > 0) {
      features.push(`${plan.trialDays}-day free trial`);
    }
    return features;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const active = effectivePlanId === plan.id;
          const isExplicit = selectedPlanId === plan.id;
          const isFree = plan.trialDays > 0 || plan.monthlyPrice === 0;
          const features = getFeatures(plan);

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`cursor-pointer rounded-2xl border transition-all relative overflow-hidden flex flex-col ${
                active
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/[0.07]"
              }`}
            >
              {active && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
              )}

              {plan.popular && !isExplicit && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-l from-cyan-500 to-purple-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl tracking-wider">
                    POPULAR
                  </div>
                </div>
              )}

              {isExplicit && (
                <div className="absolute top-0 right-0">
                  <div className="bg-emerald-500/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl tracking-wider">
                    SELECTED
                  </div>
                </div>
              )}

              {active && !isExplicit && defaultPlanId === plan.id && (
                <div className="absolute top-0 right-0">
                  <div className="bg-emerald-500/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl tracking-wider">
                    CURRENT
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-white/50 text-xs mt-1 leading-snug">
                    {plan.description}
                  </p>
                )}

                <div className="mt-4 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      {isFree ? "Free" : `£${plan.monthlyPrice}`}
                    </span>
                    {!isFree && (
                      <span className="text-sm text-white/40">/mo</span>
                    )}
                  </div>
                  {isFree && plan.trialDays > 0 && (
                    <p className="text-[11px] text-cyan-300/80 mt-1">
                      Free for {Math.round(plan.trialDays / 30)} months
                    </p>
                  )}
                  {!isFree && plan.yearlyPrice > 0 && (
                    <p className="text-[11px] text-white/40 mt-1">
                      or £{plan.yearlyPrice}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-2 flex-1">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] text-white/75"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  {active ? (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyan-300 font-semibold uppercase tracking-wider">
                      <CheckCircleIcon className="h-4 w-4" />
                      {isExplicit ? "Selected" : "Current plan"}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40 uppercase tracking-wider">
                      Click to select
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/[0.06]">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => effectivePlanId && onSelectPlan(effectivePlanId)}
          disabled={!effectivePlanId}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">Continue</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Payment                                                   */
/* ------------------------------------------------------------------ */

function PaymentStep({
  selectedPlan,
  onPay,
  loading,
  onBack,
}: {
  selectedPlan?: Plan;
  onPay: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="backdrop-blur-2xl bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
              Plan
            </p>
            <p className="text-white font-semibold text-base mt-1 truncate">
              {selectedPlan?.name || "Not selected"}
            </p>
            {selectedPlan?.description && (
              <p className="text-white/40 text-xs mt-0.5">
                {selectedPlan.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
              Amount
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              £{selectedPlan?.monthlyPrice || 0}
            </p>
            <p className="text-white/30 text-[10px]">per month</p>
          </div>
        </div>
      </div>

      <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-xl p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheckIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-cyan-300 text-xs font-semibold">
              Secure payment via Stripe
            </p>
            <p className="text-cyan-300/60 text-[11px] mt-0.5">
              You&apos;ll enter your card details on this page. Your
              subscription activates immediately after payment.
            </p>
          </div>
        </div>
      </div>

      {selectedPlan && (
        <div className="backdrop-blur-2xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-2.5">
            What&apos;s included
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedPlan.maxBookingsPerMonth > 0 && (
              <FeaturePill
                label={`${selectedPlan.maxBookingsPerMonth} bookings/mo`}
              />
            )}
            {selectedPlan.maxServices > 0 && (
              <FeaturePill label={`${selectedPlan.maxServices} services`} />
            )}
            {selectedPlan.onlineBooking && (
              <FeaturePill label="Online booking" tone="emerald" />
            )}
            {selectedPlan.analytics && (
              <FeaturePill label="Analytics" tone="cyan" />
            )}
            {selectedPlan.prioritySupport && (
              <FeaturePill label="Priority support" tone="amber" />
            )}
            {selectedPlan.customBranding && (
              <FeaturePill label="Custom branding" tone="purple" />
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/[0.06]">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onPay}
          disabled={loading}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Preparing…
              </>
            ) : (
              <>
                <CreditCardIcon className="h-4 w-4" />
                Pay £{selectedPlan?.monthlyPrice || 0}/month
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}

function FeaturePill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "emerald" | "cyan" | "amber" | "purple";
}) {
  const tones: Record<string, string> = {
    default: "bg-white/5 text-white/60 border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  };
  return (
    <span
      className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Review                                                    */
/* ------------------------------------------------------------------ */

function ReviewStep({
  isTrial,
  planName,
}: {
  isTrial: boolean;
  planName: string;
}) {
  const router = useRouter();

  return (
    <div className="text-center space-y-4 py-2">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-cyan-400/30 flex items-center justify-center">
          <CheckCircleIcon className="h-8 w-8 text-cyan-400" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">
          {isTrial ? "Free trial activated" : "Payment received"}
        </h2>
        <p className="text-white/50 text-sm mt-1 max-w-md mx-auto">
          Your salon registration is complete and is now pending admin
          approval.
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <ClockIcon className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
              Pending approval
            </p>
            <p className="text-amber-300/70 text-xs mt-1 leading-relaxed">
              Our team is reviewing your business details. This usually takes
              24–48 hours. You&apos;ll receive an email once your account is
              active.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              {isTrial ? "Trial running" : "Payment confirmed"}
            </p>
            <p className="text-emerald-300/70 text-xs mt-1 leading-relaxed">
              {isTrial
                ? `Your ${planName} plan is active for the next 60 days — no payment required.`
                : `Your ${planName} subscription has been activated. You can manage it anytime from your dashboard.`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
        <button
          onClick={() => router.push("/pending")}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
        >
          <span className="relative z-10">View application status</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        <a
          href="mailto:support@krownbraids.com"
          className="flex-1 inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white/70 hover:text-white transition-all"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}