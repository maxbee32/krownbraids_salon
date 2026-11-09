// app/dashboard/page.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
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
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  CalendarDaysIcon as CalendarSolid,
  UserGroupIcon as UsersSolid,
  BanknotesIcon as BanknotesSolid,
  Squares2X2Icon as SquaresSolid,
} from "@heroicons/react/24/solid";
import { useServiceContext } from "@/app/context/ServiceContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface DashboardBooking {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status: string;
  paymentStatus?: string | null;
}

type TrendDirection = "up" | "down" | "flat";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const mapBackendStatus = (s: string): string => {
  const u = (s ?? '').toUpperCase();
  if (u === 'PENDING') return 'pending';
  if (u === 'CONFIRMED') return 'confirmed';
  if (u === 'COMPLETED') return 'completed';
  if (u === 'CANCELLED' || u === 'REJECTED') return 'cancelled';
  if (u === 'NO_SHOW') return 'no-show';
  return 'pending';
};

const formatTime = (time: string) => {
  if (time.includes(':')) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m.slice(0, 2)} ${ampm}`;
  }
  return time;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const formatDuration = (mins: number) => {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return `${mins}m`;
};

const formatRelative = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

/* ------------------------------------------------------------------ */
/*  Stat definitions                                                   */
/* ------------------------------------------------------------------ */

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
    trend: { value: "—", direction: "flat" as TrendDirection },
  },
  {
    label: "Upcoming clients",
    key: "clients",
    icon: UsersSolid,
    accent: "from-emerald-500/25 to-emerald-600/5",
    border: "border-emerald-400/30",
    text: "text-emerald-400",
    href: "/dashboard/clients",
    defaultValue: "0",
    trend: { value: "—", direction: "flat" as TrendDirection },
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
    trend: { value: "—", direction: "flat" as TrendDirection },
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
    trend: { value: "—", direction: "flat" as TrendDirection },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    refreshServiceCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch real bookings
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const res = await fetch('/api/auth/bookings/salon', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!res.ok) {
          console.warn('Could not load dashboard bookings:', res.status);
          return;
        }

        const data: any[] = await res.json();
        const mapped: DashboardBooking[] = data.map((b) => ({
          id: String(b.id),
          clientName: b.customerName ?? '',
          serviceName: b.serviceName ?? '',
          date: b.appointmentDate ?? '',
          time: (b.appointmentTime ?? '').slice(0, 5),
          duration: b.durationMinutes ?? 0,
          amount: Number(b.servicePrice ?? 0),
          status: mapBackendStatus(b.status),
          paymentStatus: b.paymentStatus ?? null,
        }));

        setBookings(mapped);
      } catch (err) {
        console.warn('Dashboard bookings fetch failed:', err);
      } finally {
        setBookingsLoading(false);
      }
    };
    load();
  }, []);

  const today = toISODate(new Date());
  const now = new Date();

  // Today's bookings — actual schedule for the day
  const todaysBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date === today && b.status !== 'cancelled')
        .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, today]
  );

  // Upcoming bookings across all future dates
  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date >= today && b.status !== 'cancelled' && b.status !== 'completed')
        .sort((a, b) => {
          const d = a.date.localeCompare(b.date);
          return d !== 0 ? d : a.time.localeCompare(b.time);
        }),
    [bookings, today]
  );

  // Stats
  const stats = useMemo(() => {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startISO = toISODate(startOfMonth);
    const endISO = toISODate(endOfMonth);

    const monthBookings = bookings.filter((b) => b.date >= startISO && b.date <= endISO);

    const monthRevenue = monthBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.amount, 0);

    const uniqueClients = new Set(
      upcomingBookings.map((b) => b.clientName.toLowerCase()).filter(Boolean)
    );

    return {
      todayCount: todaysBookings.length,
      upcomingClients: uniqueClients.size,
      monthRevenue,
      pendingCount: bookings.filter((b) => b.status === 'pending').length,
    };
  }, [bookings, todaysBookings, upcomingBookings, now]);

  // Dynamic stat values
  const getStatValue = (key: string) => {
    if (key === 'services') return serviceCount.toString();
    if (key === 'bookings') return stats.todayCount.toString();
    if (key === 'clients') return stats.upcomingClients.toString();
    if (key === 'revenue') return formatCurrency(stats.monthRevenue);
    return null;
  };

  // Recent activity — derived from bookings
  const activity = useMemo(() => {
    const items: { text: string; time: string }[] = [];

    // Recent pending bookings
    const pending = bookings.filter((b) => b.status === 'pending').slice(0, 2);
    pending.forEach((b) => {
      items.push({
        text: `New booking — ${b.clientName}, ${b.serviceName}, ${formatRelative(b.date)} ${formatTime(b.time)}`,
        time: 'Awaiting confirmation',
      });
    });

    // Recent confirmed
    const confirmed = bookings.filter((b) => b.status === 'confirmed').slice(0, 1);
    confirmed.forEach((b) => {
      items.push({
        text: `Confirmed — ${b.clientName}, ${b.serviceName} on ${formatRelative(b.date)}`,
        time: formatTime(b.time),
      });
    });

    // Recent completed (revenue)
    const completed = bookings
      .filter((b) => b.status === 'completed' && b.paymentStatus === 'SUCCESS')
      .slice(0, 1);
    completed.forEach((b) => {
      items.push({
        text: `Payment of ${formatCurrency(b.amount)} received from ${b.clientName}`,
        time: formatRelative(b.date),
      });
    });

    return items.slice(0, 4);
  }, [bookings]);

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

      {/* ============ STAT CARDS ============ */}
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

              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.accent} ${stat.border} border flex items-center justify-center shadow-lg`}
                >
                  <Icon className={`h-6 w-6 ${stat.text}`} />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tighter tabular-nums leading-none">
                {value}
              </p>

              <p className="text-[11px] text-white/50 mt-2 uppercase tracking-wider font-semibold">
                {stat.label}
              </p>

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
                <span className="text-[10px] text-white/30 ml-1">
                  {stat.key === 'bookings' && stats.pendingCount > 0
                    ? `${stats.pendingCount} pending`
                    : 'Live data'}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ============ TODAY'S SCHEDULE ============ */}
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

          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
            </div>
          ) : todaysBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">
                No appointments scheduled for today
              </p>
              {upcomingBookings.length > 0 && (
                <button
                  onClick={() => router.push("/dashboard/bookings")}
                  className="mt-3 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  You have {upcomingBookings.length} upcoming booking{upcomingBookings.length === 1 ? '' : 's'} →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {todaysBookings.map((apt) => (
                <div
                  key={apt.id}
                  className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all"
                >
                  <div className="text-[13px] font-mono font-semibold text-cyan-300 w-16 flex-shrink-0 tabular-nums">
                    {formatTime(apt.time)}
                  </div>

                  <div
                    className={`w-1 h-10 rounded-full flex-shrink-0 ${
                      apt.status === 'confirmed'
                        ? 'bg-cyan-400'
                        : apt.status === 'pending'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {apt.clientName}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {apt.serviceName}
                    </p>
                  </div>

                  <span className="text-[11px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums">
                    {formatDuration(apt.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ RECENT ACTIVITY ============ */}
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <h2 className="text-sm font-semibold text-white mb-5">Recent activity</h2>

          {activity.length === 0 ? (
            <p className="text-white/40 text-sm py-4">
              No recent activity yet. New bookings and payments will appear here.
            </p>
          ) : (
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
          )}
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/30">
        <div className="flex items-center gap-4" />
        <span>KrownBraids · {new Date().getFullYear()}</span>
      </div>
    </>
  );
}