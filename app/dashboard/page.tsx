// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import {
  CalendarDaysIcon as CalendarSolid,
  UserGroupIcon as UsersSolid,
  BanknotesIcon as BanknotesSolid,
  Squares2X2Icon as SquaresSolid,
} from "@heroicons/react/24/solid";
import { useServiceContext } from "@/app/context/ServiceContext";

interface SalonData {
  id: number;
  name: string;
  address: string;
  city: string;
  status: string;
  onboardingStep: string;
  selectedPlanId: number | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  rejectionReason?: string;
  rejectedAt?: string;
}

const STAT_DEFS = [
  {
    label: "Today's bookings",
    key: "bookings",
    icon: CalendarSolid,
    accent: "from-blue-500/25 to-blue-600/5",
    border: "border-blue-400/30",
    text: "text-blue-400",
    href: "/dashboard/bookings",
    defaultValue: "0",
    trend: { value: "+12%", direction: "up" as const },
  },
  {
    label: "Active clients",
    key: "clients",
    icon: UsersSolid,
    accent: "from-emerald-500/25 to-emerald-600/5",
    border: "border-emerald-400/30",
    text: "text-emerald-400",
    href: "/dashboard/clients",
    defaultValue: "0",
    trend: { value: "+8%", direction: "up" as const },
  },
  {
    label: "Revenue this month",
    key: "revenue",
    icon: BanknotesSolid,
    accent: "from-purple-500/25 to-purple-600/5",
    border: "border-purple-400/30",
    text: "text-purple-400",
    href: "/dashboard/revenue",
    defaultValue: "£0",
    trend: { value: "+23%", direction: "up" as const },
  },
  {
    label: "Services",
    key: "services",
    icon: SquaresSolid,
    accent: "from-cyan-500/25 to-cyan-600/5",
    border: "border-cyan-400/30",
    text: "text-cyan-400",
    href: "/dashboard/services",
    defaultValue: "0",
    trend: { value: "Stable", direction: "flat" as const },
  },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        const onboardingResponse = await fetch(
          "/api/auth/business/salons/onboarding",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!onboardingResponse.ok) {
          if (onboardingResponse.status === 404) {
            router.replace("/setup");
            return;
          }
          setError("Failed to load salon data");
          setLoading(false);
          return;
        }

        const onboardingData = await onboardingResponse.json();

        if (!onboardingData.completed && onboardingData.step !== "COMPLETED") {
          router.replace("/setup");
          return;
        }

        const salonId = onboardingData.salonId || onboardingData.id;
        if (!salonId) {
          router.replace("/setup");
          return;
        }

        const salonResponse = await fetch(
          `/api/auth/business/salons/${salonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (salonResponse.ok) {
          const data = await salonResponse.json();
          const full = data.data || data;
          if (full?.id) setSalon(full);
          else setError("No salon data found");
        } else {
          setSalon({
            id: salonId,
            name: "Your Salon",
            address: "",
            city: "",
            status: onboardingData.step || "PENDING_APPROVAL",
            onboardingStep: onboardingData.step || "REVIEW",
            selectedPlanId: onboardingData.selectedPlanId ?? null,
          });
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading your data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const status = salon?.status || salon?.onboardingStep || "PENDING_APPROVAL";
  const isRejected = ["REJECTED", "DECLINED"].includes(status);
  const isPending = ["PENDING_APPROVAL", "PENDING", "REVIEW"].includes(status);

  useEffect(() => {
    if (!loading && salon && isRejected) {
      router.replace("/rejected");
    }
  }, [loading, salon, isRejected, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/30 max-w-md mx-auto text-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Unable to load dashboard</h2>
        <p className="text-white/40 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!salon) return null;
  if (isRejected) return null;
  if (isPending) return <PendingView salon={salon} router={router} />;
  return <ApprovedView salon={salon} router={router} />;
}

/* ---------- Pending ---------- */
function PendingView({ salon, router }: { salon: SalonData; router: any }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="backdrop-blur-2xl bg-white/5 rounded-2xl p-5 border border-white/10 mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500/25 to-purple-500/25 p-3 rounded-xl flex-shrink-0 border border-white/10">
            <BuildingOfficeIcon className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white truncate">
              {salon.name || "Your salon"}
            </h2>
            <p className="text-white/40 text-sm truncate mt-0.5">
              {salon.address && salon.city
                ? `${salon.address}, ${salon.city}`
                : "No address on file"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 p-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Account under review</h1>
            <p className="text-white/50 text-sm mt-0.5">
              We&apos;re verifying your business details
            </p>
          </div>
        </div>

        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Your application for{" "}
          <span className="text-white/90 font-medium">{salon.name}</span> was submitted
          successfully. Our team typically completes reviews within 24–48 hours.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <ol className="space-y-5">
            <li className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="w-px h-full bg-white/10 mt-1" />
              </div>
              <div className="pb-1">
                <p className="text-sm font-medium text-white">Application submitted</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Business and payment details received
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ClockIcon className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="w-px h-full bg-white/10 mt-1" />
              </div>
              <div className="pb-1">
                <p className="text-sm font-medium text-amber-300">Under review</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Estimated completion: 24–48 hours
                </p>
              </div>
            </li>
            <li className="flex gap-3 opacity-50">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Squares2X2Icon className="h-3.5 w-3.5 text-white/40" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white/70">Add services and go live</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Available once your account is approved
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/setup")}
            className="bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            Review application
          </button>
          <button
            onClick={() => router.push("/dashboard/support")}
            className="bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            Contact support
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Approved ---------- */
function ApprovedView({ salon, router }: { salon: SalonData; router: any }) {
  const { serviceCount, refreshServiceCount } = useServiceContext();

  useEffect(() => {
    refreshServiceCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = [
    {
      time: "09:30",
      client: "Amara O.",
      service: "Knotless braids",
      duration: "4h",
      bar: "bg-cyan-400",
    },
    {
      time: "11:00",
      client: "Priya S.",
      service: "Cornrows",
      duration: "2h",
      bar: "bg-purple-400",
    },
    {
      time: "14:30",
      client: "Chloe M.",
      service: "Consultation",
      duration: "30m",
      bar: "bg-amber-400",
    },
  ];

  const activity = [
    { text: "Payment of £120.00 released to your account", time: "3h ago" },
    { text: "New booking — Priya S., Cornrows, tomorrow 11:00", time: "5h ago" },
    { text: "Low stock: X-Pression braiding hair (4 left)", time: "Yesterday" },
  ];

  const getStatValue = (key: string) => {
    if (key === "services") return serviceCount.toString();
    return null;
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Welcome back, {salon.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Here&apos;s what&apos;s happening across your salon today.
        </p>
      </div>

      {/* ============ STAT CARDS (visibly different) ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {STAT_DEFS.map((stat) => {
          const Icon = stat.icon;
          const dynamicValue = getStatValue(stat.key);
          const value = dynamicValue ?? stat.defaultValue;
          const trendIsUp = stat.trend.direction === "up";
          const trendIsDown = stat.trend.direction === "down";

          return (
            <a
              key={stat.key}
              href={stat.href}
              className="group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 hover:border-cyan-400/30 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Icon row */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.accent} ${stat.border} border flex items-center justify-center shadow-lg`}
                >
                  <Icon className={`h-6 w-6 ${stat.text}`} />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* BIG value */}
              <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter tabular-nums leading-none">
                {value}
              </p>

              {/* Label */}
              <p className="text-[11px] text-white/50 mt-2 uppercase tracking-wider font-semibold">
                {stat.label}
              </p>

              {/* Trend chip */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
                {trendIsUp && (
                  <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {trendIsDown && (
                  <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-red-400" />
                )}
                <span
                  className={`text-[11px] font-medium ${
                    trendIsUp
                      ? "text-emerald-400"
                      : trendIsDown
                      ? "text-red-400"
                      : "text-white/40"
                  }`}
                >
                  {stat.trend.value}
                </span>
                <span className="text-[10px] text-white/30 ml-1">vs last week</span>
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ============ SCHEDULE (colored vertical bars) ============ */}
        <div className="lg:col-span-2 relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Today&apos;s schedule</h2>
            <button
              onClick={() => router.push("/dashboard/bookings")}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              View calendar
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-white/40 text-sm py-8 text-center">
              No appointments scheduled for today
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((apt, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all"
                >
                  {/* Time */}
                  <div className="text-[13px] font-mono font-semibold text-cyan-300 w-12 flex-shrink-0 tabular-nums">
                    {apt.time}
                  </div>

                  {/* Vertical colored bar (instead of dot) */}
                  <div className={`w-1 h-10 rounded-full ${apt.bar} flex-shrink-0`} />

                  {/* Client + service */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {apt.client}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {apt.service}
                    </p>
                  </div>

                  {/* Duration pill */}
                  <span className="text-[11px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums">
                    {apt.duration}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ ACTIVITY ============ */}
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <h2 className="text-sm font-semibold text-white mb-5">Recent activity</h2>
          <div className="space-y-4">
            {activity.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-[13px] text-white/70 leading-snug">{item.text}</p>
                  <p className="text-[11px] text-white/30 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/30">
        <div className="flex items-center gap-4" />
        <span>KrownBraids · {new Date().getFullYear()}</span>
      </div>
    </>
  );
}