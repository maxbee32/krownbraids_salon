// app/dashboard/setup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

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
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
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
  createdAt: string;
  updatedAt: string;
}

interface Alert {
  type: "success" | "error";
  message: string;
}

const STEPS = [
  { id: "business", label: "Business", icon: BuildingOfficeIcon },
  { id: "plan", label: "Plan", icon: CreditCardIcon },
  { id: "payment", label: "Payment", icon: ShieldCheckIcon },
  { id: "review", label: "Review", icon: CheckCircleIcon },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
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
    socialMedia: { facebook: "", instagram: "", twitter: "" },
  });

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

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
        const savedData = await response.json();

        const stepMap: { [key: string]: number } = {
          BUSINESS: 0,
          PLAN: 1,
          PAYMENT: 2,
          REVIEW: 3,
          COMPLETED: 3,
        };

        let stepToSet = 0;
        const hasSalonId =
          savedData.salonId !== null && savedData.salonId !== undefined;
        const hasSelectedPlan =
          savedData.selectedPlanId !== null &&
          savedData.selectedPlanId !== undefined;

        if (savedData.step && typeof savedData.step === "string") {
          stepToSet = stepMap[savedData.step] ?? 0;
        }

        if (savedData.completed) {
          stepToSet = 3;
        } else if (hasSalonId && hasSelectedPlan && stepToSet < 2) {
          stepToSet = 2;
        } else if (hasSalonId && stepToSet < 1) {
          stepToSet = 1;
        }

        if (savedData.businessData) {
          setBusinessData(savedData.businessData);
          localStorage.setItem(
            "setupBusinessData",
            JSON.stringify(savedData.businessData)
          );
        } else if (hasSalonId) {
          await fetchSalonData(savedData.salonId, token);
        }

        if (hasSelectedPlan) {
          setSelectedPlanId(savedData.selectedPlanId);
          localStorage.setItem(
            "setupSelectedPlanId",
            String(savedData.selectedPlanId)
          );
        }

        if (hasSalonId) {
          setSalonId(savedData.salonId);
          localStorage.setItem("setupSalonId", String(savedData.salonId));
        }

        setCurrentStep(stepToSet);
        localStorage.setItem("setupStep", String(stepToSet));
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

  const fetchSalonData = async (salonId: string | number, token: string) => {
    try {
      const response = await fetch(`/api/auth/business/salons/${salonId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const salon = data.data || data;
        if (!salon || Object.keys(salon).length === 0) return;

        const hasData =
          salon.name?.trim() || salon.address?.trim() || salon.city?.trim();
        if (!hasData) return;

        const updatedData: BusinessData = {
          name: salon.name || "",
          description: salon.description || "",
          email: salon.email || "",
          phoneNumber: salon.phoneNumber || "",
          website: salon.website || "",
          address: salon.address || "",
          city: salon.city || "",
          state: salon.state || "",
          country: salon.country || "United Kingdom",
          postalCode: salon.postalCode || "",
          socialMedia: {
            facebook: salon.socialMedia?.facebook || "",
            instagram: salon.socialMedia?.instagram || "",
            twitter: salon.socialMedia?.twitter || "",
          },
        };

        setBusinessData(updatedData);
        localStorage.setItem(
          "setupBusinessData",
          JSON.stringify(updatedData)
        );
      }
    } catch (error) {
      console.error("Error fetching salon data:", error);
    }
  };

  const saveOnboardingProgress = async (step: number) => {
    try {
      const token = localStorage.getItem("adminToken");

      const hasValidBusinessData =
        businessData.name?.trim() ||
        businessData.address?.trim() ||
        businessData.city?.trim();

      if (step === 0 && salonId && !hasValidBusinessData) return true;

      const stepMap: { [key: number]: string } = {
        0: "BUSINESS",
        1: "PLAN",
        2: "PAYMENT",
        3: "REVIEW",
      };

      const payload = {
        currentStep: step,
        step: stepMap[step] || "BUSINESS",
        businessData,
        selectedPlanId,
        salonId,
      };

      const response = await fetch("/api/auth/business/salons/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.warn("Error saving onboarding progress:", error);
      return false;
    }
  };

  /* ---------- Actions ---------- */

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleBusinessSubmit = async () => {
    if (!businessData.name.trim()) {
      showAlert("error", "Please enter your salon name");
      return;
    }
    if (!businessData.address.trim()) {
      showAlert("error", "Please enter your address");
      return;
    }
    if (!businessData.city.trim()) {
      showAlert("error", "Please enter your city");
      return;
    }
    if (!businessData.postalCode.trim()) {
      showAlert("error", "Please enter your postcode");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        showAlert("error", "Please sign in again");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/auth/business/salons/add-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: businessData.name,
          description: businessData.description,
          email: businessData.email,
          phoneNumber: businessData.phoneNumber,
          website: businessData.website,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state || "",
          country: businessData.country,
          postalCode: businessData.postalCode,
          socialMedia: businessData.socialMedia,
        }),
      });

      const rawResponse = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch {
        data = { message: rawResponse };
      }

      if (response.ok) {
        const newSalonId =
          data.data?.id || data.id || data.salonId || data.data?.salonId;
        if (newSalonId) {
          setSalonId(newSalonId);
          localStorage.setItem("setupSalonId", newSalonId);
        }

        await saveOnboardingProgress(1);
        setCurrentStep(1);
        showAlert("success", "Business registered successfully.");
      } else {
        showAlert("error", data.message || "Failed to register business");
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
    setCurrentStep(2);
    try {
      await saveOnboardingProgress(2);
    } catch (saveError) {
      console.warn("Progress save failed:", saveError);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlanId) {
      showAlert("error", "Please select a plan");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const salonIdFromStorage = localStorage.getItem("setupSalonId");

      if (!token || !salonIdFromStorage) {
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
          salonId: parseInt(salonIdFromStorage),
          planId: selectedPlanId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.redirectUrl) {
          if (data.checkoutId) {
            localStorage.setItem("checkoutId", data.checkoutId);
          }
          await saveOnboardingProgress(2);
          window.location.href = data.redirectUrl;
        } else {
          showAlert("error", "No redirect URL received from payment provider");
        }
      } else {
        showAlert("error", data.message || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showAlert("error", "Payment error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToStep = async (step: number) => {
    if (step < 0 || step >= STEPS.length) return;

    if (step === 0 && salonId) return;

    setCurrentStep(step);
    try {
      await saveOnboardingProgress(step);
    } catch (saveError) {
      console.warn("Progress save failed:", saveError);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

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
      {/* Background — KrownBraids */}
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

      {/* Alert */}
      {alert && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center px-4">
          <div
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

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
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
            <p className="text-cyan-300/70 text-[11px] tracking-[0.3em] uppercase font-semibold">
              Salon setup
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
              {currentStep === 0 && "Register your business"}
              {currentStep === 1 && "Choose your plan"}
              {currentStep === 2 && "Complete payment"}
              {currentStep === 3 && "Setup complete"}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {currentStep === 0 && "Tell us about your salon"}
              {currentStep === 1 && "Select the plan that suits your business"}
              {currentStep === 2 && "Secure payment to activate your salon"}
              {currentStep === 3 && "Your salon is now being reviewed"}
            </p>
          </div>

          {/* Main card */}
          <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Decorative glows inside card */}
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

            <div className="relative p-6 sm:p-8">
              {/* Progress steps */}
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

              {/* Content */}
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
                    onSelectPlan={handlePlanSelect}
                    loading={plansLoading || loading}
                    onBack={() => goToStep(0)}
                  />
                )}

                {currentStep === 2 && (
                  <PaymentStep
                    selectedPlan={selectedPlan}
                    onPay={handlePayment}
                    loading={loading}
                    onBack={() => goToStep(1)}
                  />
                )}

                {currentStep === 3 && <ReviewStep />}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
            KrownBraids · {new Date().getFullYear()}
          </p>
        </div>
      </div>
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

        <div className="col-span-2">
          <label className={labelClass}>Address *</label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className={inputClass}
              placeholder="Street address"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>City *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
            className={inputNoIconClass}
            placeholder="London"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Postcode *</label>
          <input
            type="text"
            value={data.postalCode}
            onChange={(e) =>
              setData({ ...data, postalCode: e.target.value })
            }
            className={inputNoIconClass}
            placeholder="SW1A 1AA"
            disabled={loading}
            required
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Country</label>
          <select
            value={data.country}
            onChange={(e) => setData({ ...data, country: e.target.value })}
            className={`${inputNoIconClass} [color-scheme:dark]`}
            disabled={loading}
          >
            <option value="United Kingdom">United Kingdom</option>
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
/*  Step 2 — Plan selection                                            */
/* ------------------------------------------------------------------ */

function PlanSelection({
  plans,
  selectedPlanId,
  onSelectPlan,
  loading,
  onBack,
}: {
  plans: Plan[];
  selectedPlanId: number | null;
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

  const getFeatureLabel = (plan: Plan) => {
    const features: string[] = [];
    if (plan.onlineBooking) features.push("Online booking");
    if (plan.analytics) features.push("Analytics");
    if (plan.prioritySupport) features.push("Priority support");
    if (plan.customBranding) features.push("Custom branding");
    if (plan.maxBookingsPerMonth)
      features.push(`${plan.maxBookingsPerMonth} bookings/mo`);
    if (plan.maxServices) features.push(`${plan.maxServices} services`);
    return features.slice(0, 3).join(" · ");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans.map((plan) => {
          const active = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
                active
                  ? "border-cyan-400/50 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-lg shadow-purple-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-l from-cyan-500 to-purple-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl tracking-wider">
                    POPULAR
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-white/40 text-xs mt-0.5">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-lg">
                    £{plan.monthlyPrice}
                  </p>
                  <p className="text-white/30 text-[10px]">/month</p>
                </div>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed">
                {getFeatureLabel(plan)}
              </p>

              {active && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold uppercase tracking-wider">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Selected
                </div>
              )}
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
          onClick={() => selectedPlanId && onSelectPlan(selectedPlanId)}
          disabled={!selectedPlanId}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">Continue to payment</span>
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
      {/* Plan summary */}
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

      {/* Security note */}
      <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-xl p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheckIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-cyan-300 text-xs font-semibold">
              Secure payment
            </p>
            <p className="text-cyan-300/60 text-[11px] mt-0.5">
              Your payment is encrypted and handled by our payment provider.
            </p>
          </div>
        </div>
      </div>

      {/* Plan features */}
      {selectedPlan && (
        <div className="backdrop-blur-2xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-2.5">
            What&apos;s included
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedPlan.maxBookingsPerMonth && (
              <FeaturePill label={`${selectedPlan.maxBookingsPerMonth} bookings/mo`} />
            )}
            {selectedPlan.maxServices && (
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

      {/* Actions */}
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
                Processing…
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

function ReviewStep() {
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
          Payment received
        </h2>
        <p className="text-white/50 text-sm mt-1 max-w-md mx-auto">
          Your salon registration is complete and is now pending admin approval.
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
              Our team is reviewing your business details. This usually
              takes 24–48 hours. You&apos;ll receive an email once your
              account is active.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              Payment confirmed
            </p>
            <p className="text-emerald-300/70 text-xs mt-1 leading-relaxed">
              Your subscription has been activated. You can manage it at any
              time from your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
        >
          <span className="relative z-10">Go to dashboard</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
        <button
          onClick={() => router.push("/dashboard/support")}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white/70 hover:text-white transition-all"
        >
          Contact support
        </button>
      </div>
    </div>
  );
}