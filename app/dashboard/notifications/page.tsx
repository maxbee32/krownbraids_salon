// app/dashboard/notifications/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApiNotification {
  id: number;
  eventId: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  recipientType: string;
}

interface NotificationListResponse {
  notifications: ApiNotification[];
  unread: number;
}

/* ------------------------------------------------------------------ */
/*  Icon + colour per backend type                                     */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  string,
  { icon: any; color: string; bg: string; border: string; href?: string }
> = {
  SALON_APPROVED: {
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    href: "/dashboard",
  },
  SALON_REJECTED: {
    icon: XCircleIcon,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    href: "/rejected",
  },
  SALON_OWNER_EMAIL_VERIFICATION: {
    icon: ExclamationTriangleIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  SALON_OWNER_OTP: {
    icon: CreditCardIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  PAYMENT_CONFIRMATION: {
    icon: BanknotesIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    href: "/dashboard/subscription",
  },
  SUPPLIER_APPROVED: {
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  SUPPLIER_REJECTED: {
    icon: XCircleIcon,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  ADMIN_SALON_REGISTRATION: {
    icon: ShoppingBagIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
};

const FALLBACK_META = {
  icon: BellIcon,
  color: "text-white/60",
  bg: "bg-white/5",
  border: "border-white/10",
};

/* ------------------------------------------------------------------ */
/*  Relative time                                                      */
/* ------------------------------------------------------------------ */

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "Just now";

  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError(null);
      const url =
        filter === "unread"
          ? "/api/auth/notifications?unread=true"
          : "/api/auth/notifications";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        setError("Could not load notifications");
        return;
      }

      const data: NotificationListResponse = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleItemClick = async (n: ApiNotification) => {
    if (!n.read) {
      // Optimistic
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, read: true } : item
        )
      );
      setUnread((u) => Math.max(0, u - 1));

      const token = localStorage.getItem("adminToken");
      if (token) {
        fetch(`/api/auth/notifications/${n.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }

    const meta = TYPE_META[n.recipientType] ?? FALLBACK_META;
    // The recipientType field is not the notification type — for navigation
    // we rely on the subject prefix instead.
    if (n.subject.toLowerCase().includes("approved")) {
      router.push("/dashboard");
    } else if (n.subject.toLowerCase().includes("rejected")) {
      router.push("/rejected");
    } else if (meta.href) {
      router.push(meta.href);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      await fetch("/api/auth/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Your booking, payment, and account updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
              : "bg-white/5 text-white/60 hover:text-white border border-white/10"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filter === "unread"
              ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
              : "bg-white/5 text-white/60 hover:text-white border border-white/10"
          }`}
        >
          Unread
          {unread > 0 && (
            <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        {loading ? (
          <div className="py-20 text-center">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400" />
            <p className="text-white/40 mt-4 text-sm">Loading…</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-white/60 text-sm">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <BellIcon className="h-7 w-7 text-white/30" />
            </div>
            <p className="text-white/60 text-sm font-medium">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {filter === "unread"
                ? "You're all caught up."
                : "We'll show you updates about your salon here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {notifications.map((n) => {
              const meta = FALLBACK_META;
              const Icon = meta.icon;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      n.read
                        ? "hover:bg-white/[0.03]"
                        : "bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={`text-sm font-medium ${
                              n.read ? "text-white/70" : "text-white"
                            }`}
                          >
                            {n.subject}
                          </p>
                          {!n.read && (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-white/50 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-white/30 mt-2">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center text-white/20 text-[10px] mt-6 tracking-widest uppercase">
        KrownBraids · {new Date().getFullYear()}
      </p>
    </>
  );
}