// app/dashboard/subscription/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  ArrowUpIcon,
  LockClosedIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
}

interface Subscription {
  id: string;
  planId: number;
  planName: string;
  planCode: string;
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" | "EXPIRED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  billingCycle: "MONTHLY" | "YEARLY";
  daysRemaining?: number;
}

interface Usage {
  bookingsThisMonth: number;
  bookingsLimit: number;
  servicesCount: number;
  servicesLimit: number;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED";
  invoiceUrl?: string;
  periodStart: string;
  periodEnd: string;
}

interface RawSalon {
  id?: number;
  name?: string;
  status?: string;
  onboardingStep?: string;
  selectedPlanId?: number;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  SubscriptionStartDate?: string | null;
  SubscriptionEndDate?: string | null;
  [key: string]: any;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const daysUntil = (iso: string | null | undefined) => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
};

const planNameFromId = (id: number) =>
  id === 1 ? "Starter" : id === 2 ? "Professional" : id === 3 ? "Business" : "Starter";

/**
 * Pick a subscription date from a raw salon payload regardless of casing.
 */
const pickSubStart = (s: RawSalon): string | null =>
  s.subscriptionStartDate ?? s.SubscriptionStartDate ?? null;

const pickSubEnd = (s: RawSalon): string | null =>
  s.subscriptionEndDate ?? s.SubscriptionEndDate ?? null;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<Plan | null>(null);

  /* ---------- Load everything ---------- */
  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      /* ---------- 1. Load plans ---------- */
      let loadedPlans: Plan[] = [];
      try {
        const plansRes = await fetch("/api/auth/subscription/plan");
        if (plansRes.ok) {
          const json = await plansRes.json();
          const raw = Array.isArray(json) ? json : json.data || json.plans || [];
          loadedPlans = raw;
          setPlans(raw);
        }
      } catch (err) {
        console.warn("Failed to load plans:", err);
      }

      /* ---------- 2. Load salon (source of truth for subscription) ---------- */
      try {
        const onboardingRes = await fetch(
          "/api/auth/business/salons/onboarding",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (onboardingRes.ok) {
          const onboarding = await onboardingRes.json();
          const salonId = onboarding.salonId || onboarding.id;

          if (salonId) {
            const salonRes = await fetch(
              `/api/auth/business/salons/${salonId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (salonRes.ok) {
              const data = await salonRes.json();
              const salon: RawSalon = data.data || data;

              const subStart = pickSubStart(salon);
              const subEnd = pickSubEnd(salon);
              const planId = salon.selectedPlanId ?? 1;
              const currentPlan = loadedPlans.find((p) => p.id === planId);

              const isActive = ["APPROVED", "ACTIVE", "COMPLETED"].includes(
                salon.status || ""
              );
              const remaining = daysUntil(subEnd);

              setSubscription({
                id: `salon-${salon.id}`,
                planId,
                planName:
                  currentPlan?.name || planNameFromId(planId),
                planCode: currentPlan?.code || "",
                status: isActive ? "ACTIVE" : "PAST_DUE",
                currentPeriodStart: subStart || "",
                currentPeriodEnd: subEnd || "",
                cancelAtPeriodEnd: false,
                amount: currentPlan?.monthlyPrice ?? 0,
                billingCycle: "MONTHLY",
                daysRemaining: subEnd ? remaining : undefined,
              });
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load salon subscription:", err);
      }

      /* ---------- 3. Usage (best-effort) ---------- */
      try {
        const usageRes = await fetch("/api/auth/subscription/usage");
        if (usageRes.ok) {
          const json = await usageRes.json();
          const u = json.data || json;
          if (u) setUsage(u);
        }
      } catch {
        // ignore — usage is optional
      }

      /* ---------- 4. Invoices (best-effort) ---------- */
      try {
        const invoicesRes = await fetch("/api/auth/subscription/invoices");
        if (invoicesRes.ok) {
          const json = await invoicesRes.json();
          const raw = Array.isArray(json) ? json : json.data || [];
          setInvoices(raw);
        }
      } catch {
        // ignore — invoices are optional
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ---------- Session expiring ---------- */
  useEffect(() => {
    const handler = () => {
      setShowCancelModal(false);
      setShowUpgradeModal(null);
      setActionLoading(null);
      setError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  /* ---------- Actions ---------- */
  const handleUpgrade = async (plan: Plan) => {
    setActionLoading(`upgrade-${plan.id}`);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/subscription/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to change plan");
        return;
      }

      if (json.redirectUrl) {
        window.location.href = json.redirectUrl;
        return;
      }

      await loadAll();
      setShowUpgradeModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/auth/subscription/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to cancel subscription");
        return;
      }
      await loadAll();
      setShowCancelModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading("resume");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/auth/subscription/resume", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Failed to resume subscription");
        return;
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Derived ---------- */
  const currentPlan = plans.find((p) => p.id === subscription?.planId);
  const daysRemaining = subscription?.daysRemaining ?? 0;
  const hasSubscription = Boolean(subscription?.currentPeriodEnd);
  const isExpired = hasSubscription && daysRemaining <= 0;
  const isExpiringSoon = hasSubscription && daysRemaining > 0 && daysRemaining <= 7;

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading subscription</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Subscription
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Manage your plan, billing and invoices.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-amber-400/60 hover:text-amber-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Current plan card */}
      {subscription && hasSubscription && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                    Current plan
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    {subscription.planName}
                  </h2>
                  {currentPlan?.description && (
                    <p className="text-sm text-white/50 mt-1">
                      {currentPlan.description}
                    </p>
                  )}
                </div>
              </div>

              {isExpired ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-red-500/10 border-red-500/20 text-red-400">
                  <XCircleIcon className="h-3.5 w-3.5" />
                  Expired
                </span>
              ) : isExpiringSoon ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  Expiring soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Active
                </span>
              )}
            </div>

            {/* Plan meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                  Amount
                </p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(subscription.amount)}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  per{" "}
                  {subscription.billingCycle === "YEARLY" ? "year" : "month"}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                  Started
                </p>
                <p className="text-sm font-semibold text-white">
                  {formatDate(subscription.currentPeriodStart)}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                  Renews on
                </p>
                <p className="text-sm font-semibold text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                  Days remaining
                </p>
                <p
                  className={`text-xl font-bold ${
                    isExpired
                      ? "text-red-400"
                      : isExpiringSoon
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {daysRemaining}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const next = plans.find(
                    (p) =>
                      p.id !== subscription.planId &&
                      p.monthlyPrice > (currentPlan?.monthlyPrice ?? 0)
                  );
                  setShowUpgradeModal(next || plans[0] || null);
                }}
                disabled={actionLoading !== null || plans.length === 0}
                className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ArrowUpIcon className="h-4 w-4" />
                  Change plan
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                onClick={handleResume}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60"
              >
                {actionLoading === "resume" ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                )}
                Resume auto‑renew
              </button>

              <button
                onClick={loadAll}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {isExpiringSoon && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/90">
                  Your plan expires in{" "}
                  <strong>
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </strong>
                  . Renew before{" "}
                  <strong>{formatDate(subscription.currentPeriodEnd)}</strong>{" "}
                  to keep your salon active.
                </p>
              </div>
            )}

            {isExpired && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300/90">
                  Your plan expired on{" "}
                  <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
                  Renew to reactivate bookings and marketplace access.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No subscription */}
      {!hasSubscription && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="p-12 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 inline-flex mb-4">
              <CreditCardIcon className="h-12 w-12 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No active subscription
            </h3>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Choose a plan below to start taking bookings on KrownBraids.
            </p>
          </div>
        </div>
      )}

      {/* Usage (if available) */}
      {usage && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

          <div className="flex items-center gap-2 mb-5">
            <ChartBarIcon className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              This month&apos;s usage
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UsageBar
              label="Bookings"
              current={usage.bookingsThisMonth}
              limit={usage.bookingsLimit}
              color="cyan"
            />
            <UsageBar
              label="Active services"
              current={usage.servicesCount}
              limit={usage.servicesLimit}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Plans */}
      {plans.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Available plans
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === subscription?.planId;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  onSelect={() => {
                    if (isCurrent) return;
                    setShowUpgradeModal(plan);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="p-5 pb-3 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Billing history</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-white/[0.06]">
                  <th className="text-left text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Period
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Amount
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">

                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showUpgradeModal && (
        <ChangePlanModal
          plan={showUpgradeModal}
          currentPlan={currentPlan}
          loading={actionLoading === `upgrade-${showUpgradeModal.id}`}
          onConfirm={() => handleUpgrade(showUpgradeModal)}
          onClose={() => setShowUpgradeModal(null)}
        />
      )}

      {showCancelModal && (
        <CancelModal
          loading={actionLoading === "cancel"}
          endDate={subscription?.currentPeriodEnd}
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Usage bar                                                          */
/* ------------------------------------------------------------------ */

function UsageBar({
  label,
  current,
  limit,
  color,
}: {
  label: string;
  current: number;
  limit: number;
  color: "cyan" | "purple";
}) {
  const pct = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  const barColor = isAtLimit
    ? "from-red-500 to-red-400"
    : isNearLimit
    ? "from-amber-500 to-amber-400"
    : color === "cyan"
    ? "from-cyan-500 to-cyan-400"
    : "from-purple-500 to-purple-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-xs text-white/50">
          {current} / {limit === 0 ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-[11px] text-red-400 mt-1.5">
          Limit reached — upgrade to keep growing.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-[11px] text-amber-400 mt-1.5">
          Approaching your plan limit.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const features = [
    plan.maxBookingsPerMonth > 0 && `${plan.maxBookingsPerMonth} bookings / month`,
    plan.maxServices > 0 && `${plan.maxServices} active services`,
    plan.onlineBooking && "Online booking",
    plan.analytics && "Revenue analytics",
    plan.prioritySupport && "Priority support",
    plan.customBranding && "Custom branding",
  ].filter(Boolean) as string[];

  return (
    <div
      className={`relative backdrop-blur-2xl bg-white/5 rounded-2xl border overflow-hidden transition-all ${
        isCurrent
          ? "border-cyan-400/40"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {plan.popular && !isCurrent && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-l from-cyan-500 to-purple-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl tracking-wider">
            POPULAR
          </div>
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-bl-xl tracking-wider">
            CURRENT
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      <div className="p-5">
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        {plan.description && (
          <p className="text-xs text-white/50 mt-1">{plan.description}</p>
        )}

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {formatCurrency(plan.monthlyPrice)}
          </span>
          <span className="text-sm text-white/40">/month</span>
        </div>
        {plan.yearlyPrice > 0 && (
          <p className="text-[11px] text-white/40 mt-1">
            or {formatCurrency(plan.yearlyPrice)} / year
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <CheckCircleIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={isCurrent}
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
            isCurrent
              ? "bg-white/5 border border-white/10 text-white/40 cursor-default"
              : "relative bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30 overflow-hidden group"
          }`}
        >
          {isCurrent ? (
            "Current plan"
          ) : (
            <>
              <span className="relative z-10">Choose this plan</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Invoice row                                                        */
/* ------------------------------------------------------------------ */

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    PAID:    { label: "Paid",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    PENDING: { label: "Pending", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
    FAILED:  { label: "Failed",  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  };
  const meta = statusMap[invoice.status] || statusMap.PENDING;

  return (
    <tr className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-3 text-sm text-white/80 whitespace-nowrap">
        {formatDate(invoice.date)}
      </td>
      <td className="px-5 py-3 text-sm text-white/50 whitespace-nowrap">
        {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
      </td>
      <td className="px-5 py-3 text-right text-sm font-semibold text-white whitespace-nowrap">
        {formatCurrency(invoice.amount)}
      </td>
      <td className="px-5 py-3 text-right whitespace-nowrap">
        <span
          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}
        >
          {meta.label}
        </span>
      </td>
      <td className="px-5 py-3 text-right whitespace-nowrap">
        {invoice.invoiceUrl && (
          <a
            href={invoice.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Download
          </a>
        )}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Change plan modal                                                  */
/* ------------------------------------------------------------------ */

function ChangePlanModal({
  plan,
  currentPlan,
  loading,
  onConfirm,
  onClose,
}: {
  plan: Plan;
  currentPlan?: Plan;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isUpgrade = (currentPlan?.monthlyPrice ?? 0) < plan.monthlyPrice;
  const priceDiff = plan.monthlyPrice - (currentPlan?.monthlyPrice ?? 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-md my-0 sm:my-8 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">
            {isUpgrade ? "Upgrade plan" : "Change plan"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
              New plan
            </p>
            <p className="text-lg font-bold text-white">{plan.name}</p>
            {plan.description && (
              <p className="text-xs text-white/50 mt-1">{plan.description}</p>
            )}

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {formatCurrency(plan.monthlyPrice)}
              </span>
              <span className="text-sm text-white/40">/month</span>
            </div>
          </div>

          {currentPlan && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-white/50">Current plan</span>
              <span className="text-white/80 font-medium">
                {currentPlan.name} — {formatCurrency(currentPlan.monthlyPrice)}/mo
              </span>
            </div>
          )}

          {priceDiff !== 0 && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-white/50">
                {isUpgrade ? "Additional charge" : "Credit"}
              </span>
              <span
                className={`font-semibold ${
                  isUpgrade ? "text-cyan-400" : "text-emerald-400"
                }`}
              >
                {isUpgrade ? "+" : "−"}
                {formatCurrency(Math.abs(priceDiff))}
                <span className="text-white/40 font-normal">/mo</span>
              </span>
            </div>
          )}

          {isUpgrade && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-2">
              <SparklesIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300/90">
                You&apos;ll be charged a prorated amount today. Your new plan
                features activate immediately.
              </p>
            </div>
          )}

          {!isUpgrade && priceDiff < 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300/90">
                A credit will be applied to your account. Your new plan takes
                effect at the next billing cycle.
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
            <LockClosedIcon className="h-4 w-4 text-white/40 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50">
              Secure payment processed via Stripe. You can cancel anytime from
              this page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  {isUpgrade ? "Upgrade now" : "Confirm change"}
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cancel modal                                                       */
/* ------------------------------------------------------------------ */

function CancelModal({
  loading,
  endDate,
  onConfirm,
  onClose,
}: {
  loading: boolean;
  endDate?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-md my-0 sm:my-8 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent rounded-t-3xl" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">
            Cancel subscription
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium mb-1">
                Are you sure you want to cancel?
              </p>
              <p className="text-xs text-white/50">
                You&apos;ll keep access to your current plan until the end of
                your billing period
                {endDate ? ` on ${formatDate(endDate)}` : ""}. After that, your
                salon will be paused and won&apos;t appear in the marketplace.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">
              You&apos;ll lose access to
            </p>
            <ul className="space-y-1.5">
              {[
                "Online booking & calendar",
                "Marketplace visibility",
                "Client notifications",
                "Revenue analytics",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-white/60"
                >
                  <XCircleIcon className="h-3.5 w-3.5 text-red-400/70 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/90">
              You can resume your subscription anytime before it expires — your
              data will be kept safe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60"
          >
            Keep my plan
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/90 hover:bg-red-500 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4" />
                Cancel subscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}