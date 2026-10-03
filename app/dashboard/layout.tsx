// app/dashboard/layout.tsx
"use client";
import { useEffect, useState } from "react";
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
    REJECTED:         { label: "Declined",       color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircleIcon },
    DECLINED:         { label: "Declined",       color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircleIcon },
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
/*  Handles camelCase and PascalCase keys for the subscription fields  */
/* ------------------------------------------------------------------ */

interface RawSalon {
  id?: number;
  name?: string;
  city?: string;
  address?: string;
  selectedPlanId?: number;
  status?: string;
  onboardingStep?: string;
  // camelCase (preferred)
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  // PascalCase (legacy)
  SubscriptionStartDate?: string | null;
  SubscriptionEndDate?: string | null;
  [key: string]: any;
}

const toSidebarSalon = (raw: RawSalon): SidebarSalon => ({
  id: raw.id ?? 0,
  name: raw.name || "Your Salon",
  city: raw.city || "",
  address: raw.address || "",
  selectedPlanId: raw.selectedPlanId ?? 1,
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

  const { msRemaining, showWarning, refresh } = useSessionExpiry();

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

  useEffect(() => {
    if (showWarning) {
      window.dispatchEvent(new CustomEvent("session-expiring"));
    }
  }, [showWarning]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const onboardingResponse = await fetch(
          "/api/auth/business/salons/onboarding",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!onboardingResponse.ok) {
          if (onboardingResponse.status === 404) {
            router.push("/dashboard/setup");
            return;
          }
          return;
        }

        const onboardingData = await onboardingResponse.json();
        const salonId = onboardingData.salonId || onboardingData.id;
        if (!salonId) {
          router.push("/dashboard/setup");
          return;
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
          const fallbackSalon: SidebarSalon = {
            id: salonId,
            name: "Your Salon",
            city: "",
            address: "",
            selectedPlanId: onboardingData.selectedPlanId || 1,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
          };
          setSalon(fallbackSalon);

          resolvedStatus =
            onboardingData.step || onboardingData.status || "PENDING_APPROVAL";
          setSalonStatus(resolvedStatus);
        }

        // Route-level authorization check happens here
        if (!isPathAllowed(pathname, resolvedStatus)) {
          router.replace("/dashboard");
          return;
        }

        setVerified(true);
      } catch (err) {
        console.error("Error loading salon:", err);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  const statusLabel = salonStatus ? formatStatus(salonStatus) : null;

  const pageLabel = (() => {
    if (pathname === "/dashboard") return "Overview";
    const seg = pathname.split("/").filter(Boolean).pop() || "";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  })();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
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
        </div>
      </div>

      {/* Glow orbs */}
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

        {verified ? (
          <main className="p-4 md:p-8 max-w-6xl mx-auto">{children}</main>
        ) : (
          <main className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
                <p className="text-white/40 mt-4 text-sm">Loading…</p>
              </div>
            </div>
          </main>
        )}
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