// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  ScissorsIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { useServiceContext } from '@/app/context/ServiceContext';
import { StatCard } from "../components/dashboard/StatCard";

interface SalonData {
  id: number;
  name: string;
  address: string;
  city: string;
  status: string;
  onboardingStep: string;
  selectedPlanId: number;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  rejectionReason?: string;
  rejectedAt?: string;
}

const planNameFromId = (id: number) =>
  id === 1 ? "Starter" : id === 2 ? "Professional" : id === 3 ? "Business" : "Starter";

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
          router.push("/login");
          return;
        }

        const onboardingResponse = await fetch("/api/auth/business/salons/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!onboardingResponse.ok) {
          if (onboardingResponse.status === 404) {
            router.push("/dashboard/setup");
            return;
          }
          setError("Failed to load salon data");
          setLoading(false);
          return;
        }

        const onboardingData = await onboardingResponse.json();
        const salonId = onboardingData.salonId || onboardingData.id;
        if (!salonId) {
          router.push("/dashboard/setup");
          return;
        }

        const salonResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
            selectedPlanId: onboardingData.selectedPlanId || 1,
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

  const status = salon.status || salon.onboardingStep || "PENDING_APPROVAL";
  const isPending = ["PENDING_APPROVAL", "PENDING", "REVIEW"].includes(status);
  const isRejected = ["REJECTED", "DECLINED"].includes(status);

  if (isPending) return <PendingView salon={salon} router={router} />;
  if (isRejected) return <RejectedView salon={salon} router={router} />;
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
                  <Squares2X2Icon  className="h-3.5 w-3.5 text-white/40" />
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
            onClick={() => router.push("/dashboard/setup")}
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

  const [stats, setStats] = useState([
  {
    label: "Today's bookings",
    value: "0",
    icon: CalendarIcon,
    color: "text-blue-400",
    href: "/dashboard/bookings",
  },
  {
    label: "Active clients",
    value: "0",
    icon: UserGroupIcon,
    color: "text-emerald-400",
    href: "/dashboard/clients",
  },
  {
    label: "Revenue this month",
    value: "£0",
    icon: BanknotesIcon,
    color: "text-purple-400",
    href: "/dashboard/revenue",
  },
  {
    label: "Services",
    value: "0",
    icon: Squares2X2Icon,
    color: "text-cyan-400",
    href: "/dashboard/services",
  },
]);

  useEffect(() => {
    refreshServiceCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStats((prev) =>
      prev.map((stat) =>
        stat.label === "Services" ? { ...stat, value: serviceCount.toString() } : stat
      )
    );
  }, [serviceCount]);

  const upcoming = [
    { time: "09:30", client: "Amara O.", service: "Knotless braids", duration: "4h" },
    { time: "11:00", client: "Priya S.", service: "Cornrows", duration: "2h" },
    { time: "14:30", client: "Chloe M.", service: "Consultation", duration: "30m" },
  ];

  const activity = [
    { text: "Payment of £120.00 released to your account", time: "3h ago" },
    { text: "New booking — Priya S., Cornrows, tomorrow 11:00", time: "5h ago" },
    { text: "Low stock: X-Pression braiding hair (4 left)", time: "Yesterday" },
  ];

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {stats.map((stat, i) => (
  <StatCard
    key={i}
    label={stat.label}
    value={stat.value}
    icon={stat.icon}
    color={stat.color}
    href={stat.href}
  />
))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
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
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/20 transition-colors"
                >
                  <div className="text-[12px] font-mono text-cyan-300 w-12 flex-shrink-0">
                    {apt.time}
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{apt.client}</p>
                    <p className="text-xs text-white/40 truncate">{apt.service}</p>
                  </div>
                  <span className="text-[11px] text-white/40 flex-shrink-0">
                    {apt.duration}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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
        <div className="flex items-center gap-4">
          {/* <span>Salon ID: {salon.id}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>Plan: {planNameFromId(salon.selectedPlanId || 1)}</span> */}
        </div>
        <span>KrownBraids · {new Date().getFullYear()}</span>
      </div>
    </>
  );
}

/* ---------- Rejected ---------- */
function RejectedView({ salon, router }: { salon: SalonData; router: any }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 p-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <XCircleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Application not approved</h1>
            <p className="text-white/50 text-xs mt-0.5">For {salon.name || "your salon"}</p>
          </div>
        </div>

        <p className="text-white/60 text-sm leading-relaxed mb-6">
          We were unable to approve your application at this time. This is often due to
          incomplete business information or details that couldn&apos;t be verified.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-xs text-white/50 leading-relaxed">
            If you believe this was a mistake, or you have additional documentation to
            provide, please contact our support team.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/support")}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Contact support
        </button>
      </div>
    </div>
  );
}