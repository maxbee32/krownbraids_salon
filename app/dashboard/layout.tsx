// app/dashboard/layout.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Sidebar, SidebarSalon } from "../components/dashboard/Sidebar";
import { TopBar } from "../components/dashboard/TopBar";
import { SessionExpiryModal } from "../components/dashboard/SessionExpiryModal";
import { useSessionExpiry } from "../../lib/useSessionExpiry";

/* ------------------------------------------------------------------ */
/*  Status formatting                                                  */
/* ------------------------------------------------------------------ */

const formatStatus = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    PENDING_APPROVAL: { label: "Pending review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: ClockIcon },
    PENDING:          { label: "Pending review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: ClockIcon },
    REVIEW:           { label: "In review",      color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: ClockIcon },
    APPROVED:         { label: "Active",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircleIcon },
    ACTIVE:           { label: "Active",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircleIcon },
    COMPLETED:        { label: "Active",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircleIcon },
    REJECTED:         { label: "Declined",       color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       icon: XCircleIcon },
    DECLINED:         { label: "Declined",       color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       icon: XCircleIcon },
  };
  return map[status] || {
    label: status?.replace(/_/g, " ") || "Unknown",
    color: "text-white/50",
    bg: "bg-white/5 border-white/10",
    icon: ClockIcon,
  };
};

/* ------------------------------------------------------------------ */
/*  Route access rules                                                 */
/* ------------------------------------------------------------------ */

const ACTIVE_STATUSES = ["APPROVED", "ACTIVE", "COMPLETED"];
const REJECTED_STATUSES = ["REJECTED", "DECLINED"];

const ALWAYS_ALLOWED = [
  "/dashboard",
  "/dashboard/support",
  "/dashboard/settings",
];

const isPathAllowed = (pathname: string, salonStatus: string): boolean => {
  const isAlwaysAllowed = ALWAYS_ALLOWED.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isAlwaysAllowed) return true;

  if (ACTIVE_STATUSES.includes(salonStatus)) return true;

  return false;
};

/* ------------------------------------------------------------------ */
/*  Normalise the salon payload                                        */
/* ------------------------------------------------------------------ */

interface RawSalon {
  id?: number;
  name?: string;
  city?: string;
  address?: string;
  selectedPlanId?: number;
  planName?: string | null;
  status?: string;
  onboardingStep?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  SubscriptionStartDate?: string | null;
  SubscriptionEndDate?: string | null;
  [key: string]: any;
}

const toSidebarSalon = (raw: RawSalon): SidebarSalon => ({
  id: raw.id ?? 0,
  name: raw.name || "Your Salon",
  city: raw.city || "",
  address: raw.address || "",
  selectedPlanId: raw.selectedPlanId ?? null,
  planName: raw.planName ?? null,
  subscriptionStartDate:
    raw.subscriptionStartDate ?? raw.SubscriptionStartDate ?? null,
  subscriptionEndDate:
    raw.subscriptionEndDate ?? raw.SubscriptionEndDate ?? null,
});

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [salon, setSalon] = useState<SidebarSalon | null>(null);
  const [salonStatus, setSalonStatus] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const { msRemaining, showWarning, refresh } = useSessionExpiry();

  /* ---------------------------------------------------------------- */
  /*  Reusable salon loader (also used by the "plan-changed" listener) */
  /* ---------------------------------------------------------------- */

  /**
   * Loads the salon from the Business service and updates sidebar state.
   * Returns the resolved status so callers can apply route guards.
   *
   * - On the first call (route guard path), it will redirect if the salon
   *   is missing, rejected, onboarding-incomplete, or the path is forbidden.
   * - On subsequent calls (triggered by `plan-changed`), it just refreshes
   *   the salon fields without enforcing navigation (the user is already
   *   on a valid route).
   */
  const loadSalon = useCallback(
    async (opts?: { enforceRouteGuards?: boolean }): Promise<string | null> => {
      const enforceRouteGuards = opts?.enforceRouteGuards ?? false;

      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          if (enforceRouteGuards) router.replace("/login");
          return null;
        }

        const onboardingResponse = await fetch(
          "/api/auth/business/salons/onboarding",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!onboardingResponse.ok) {
          if (enforceRouteGuards && onboardingResponse.status === 404) {
            router.replace("/setup");
          }
          return null;
        }

        const onboardingData = await onboardingResponse.json();
        const salonId = onboardingData.salonId || onboardingData.id;
        if (!salonId) {
          if (enforceRouteGuards) router.replace("/setup");
          return null;
        }

        const salonResponse = await fetch(
          `/api/auth/business/salons/${salonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let resolvedStatus: string;

        if (salonResponse.ok) {
          const data = await salonResponse.json();
          const full: RawSalon = data.data || data;

          if (full?.id) {
            setSalon(toSidebarSalon(full));
            resolvedStatus =
              full.status || full.onboardingStep || "PENDING_APPROVAL";
            setSalonStatus(resolvedStatus);
          } else {
            resolvedStatus = "PENDING_APPROVAL";
            setSalonStatus(resolvedStatus);
          }
        } else {
          setSalon({
            id: salonId,
            name: "Your Salon",
            city: "",
            address: "",
            selectedPlanId: onboardingData.selectedPlanId ?? null,
            planName: null,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
          });
          resolvedStatus =
            onboardingData.step || onboardingData.status || "PENDING_APPROVAL";
          setSalonStatus(resolvedStatus);
        }

        if (!enforceRouteGuards) {
          return resolvedStatus;
        }

        /* Route guards (first load only) */

        if (REJECTED_STATUSES.includes(resolvedStatus)) {
          router.replace("/pending");
          return resolvedStatus;
        }

        if (
          !onboardingData.completed &&
          onboardingData.step !== "COMPLETED"
        ) {
          router.replace("/setup");
          return resolvedStatus;
        }

        if (!isPathAllowed(pathname, resolvedStatus)) {
          router.replace("/dashboard");
          return resolvedStatus;
        }

        setVerified(true);
        return resolvedStatus;
      } catch (err) {
        console.error("Error loading salon:", err);
        return null;
      }
    },
    [pathname, router]
  );

  /* ---------------------------------------------------------------- */
  /*  Effects                                                         */
  /* ---------------------------------------------------------------- */

  // 1. Read the token once on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    setHasToken(Boolean(token));

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // 2. Session-expiring event dispatch
  useEffect(() => {
    if (showWarning) {
      window.dispatchEvent(new CustomEvent("session-expiring"));
    }
  }, [showWarning]);

  // 3. Onboarding + salon verification (route guard path)
  useEffect(() => {
    if (hasToken !== true) return;
    loadSalon({ enforceRouteGuards: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, pathname]);

  // 4. Refresh sidebar data whenever a plan change completes
  useEffect(() => {
    if (hasToken !== true) return;
    const handler = () => {
      loadSalon({ enforceRouteGuards: false });
    };
    window.addEventListener("plan-changed", handler);
    return () => window.removeEventListener("plan-changed", handler);
  }, [hasToken, loadSalon]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                        */
  /* ---------------------------------------------------------------- */

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    router.push("/login");
  };

  const handleStaySignedIn = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        handleLogout();
        return;
      }

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        handleLogout();
        return;
      }

      const json = await res.json();
      const newToken = json.token || json.data?.token;

      if (!newToken) {
        handleLogout();
        return;
      }

      localStorage.setItem("adminToken", newToken);
      refresh();
    } catch (err) {
      console.error("Failed to refresh session:", err);
      handleLogout();
    }
  };

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                          */
  /* ---------------------------------------------------------------- */

  if (hasToken === null) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="fixed inset-0 w-full h-full z-0">
          <div className="relative w-full h-full">
            <Image
              src="/assets/styke-12.webp"
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          </div>
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
            <p className="text-white/40 mt-4 text-sm">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasToken === false) {
    return null;
  }

  if (!verified) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="fixed inset-0 w-full h-full z-0">
          <div className="relative w-full h-full">
            <Image
              src="/assets/styke-12.webp"
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          </div>
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
            <p className="text-white/40 mt-4 text-sm">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Verified render                                                 */
  /* ---------------------------------------------------------------- */

  const statusLabel = salonStatus ? formatStatus(salonStatus) : null;

  const pageLabel = (() => {
    if (pathname === "/dashboard") return "Overview";
    const seg = pathname.split("/").filter(Boolean).pop() || "";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  })();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
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

      <Sidebar
        salon={salon}
        status={salonStatus ?? undefined}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative z-10 md:pl-72">
        <TopBar
          pageLabel={pageLabel}
          status={statusLabel}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="p-4 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>

      <SessionExpiryModal
        open={showWarning}
        msRemaining={msRemaining}
        onStay={handleStaySignedIn}
        onLogout={handleLogout}
      />
    </div>
  );
}