// components/dashboard/NotificationBell.tsx
"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NotificationType =
  | "booking"
  | "payment"
  | "stock"
  | "subscription"
  | "account";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO timestamp. Format for display with a relative-time helper. */
  createdAt: string;
  read: boolean;
  /** Where clicking the notification should take the user */
  href?: string;
}

const STORAGE_KEY = "krownbraids_notifications_read";

/* ------------------------------------------------------------------ */
/*  Icon + colour per type                                             */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  NotificationType,
  { icon: any; color: string; bg: string; border: string }
> = {
  booking: {
    icon: CalendarDaysIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  payment: {
    icon: BanknotesIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  stock: {
    icon: ShoppingBagIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  subscription: {
    icon: CreditCardIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  account: {
    icon: ExclamationTriangleIcon,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
};

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
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

  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/*  Initial seed (replace with real API later)                         */
/* ------------------------------------------------------------------ */

function seedNotifications(): NotificationItem[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

  return [
    {
      id: "n1",
      type: "booking",
      title: "New booking confirmed",
      body: "Amara Okafor — Knotless braids, tomorrow at 09:30",
      createdAt: minutesAgo(2),
      read: false,
      href: "/dashboard/bookings",
    },
    {
      id: "n2",
      type: "stock",
      title: "Low stock alert",
      body: "X-Pression braiding hair — 4 units remaining",
      createdAt: hoursAgo(1),
      read: false,
      href: "/dashboard/marketplace",
    },
    {
      id: "n3",
      type: "payment",
      title: "Payment released",
      body: "£120.00 released to your account",
      createdAt: hoursAgo(3),
      read: false,
      href: "/dashboard/revenue",
    },
    {
      id: "n4",
      type: "subscription",
      title: "Subscription renewal",
      body: "Professional plan renews in 23 days",
      createdAt: daysAgo(1),
      read: true,
      href: "/dashboard/subscription",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  /* ---------- Load + persist read state ---------- */
  useEffect(() => {
    setMounted(true);

    // Load seed data + any persisted read IDs
    const seed = seedNotifications();
    let readIds: Set<string> = new Set();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) readIds = new Set(parsed);
      }
    } catch {
      // ignore
    }

    const withReadState = seed.map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }));

    setNotifications(withReadState);
  }, []);

  /* ---------- Persist read IDs whenever they change ---------- */
  useEffect(() => {
    if (!mounted) return;
    try {
      const readIds = notifications.filter((n) => n.read).map((n) => n.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
    } catch {
      // ignore
    }
  }, [notifications, mounted]);

  /* ---------- Position the dropdown ---------- */
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  /* ---------- Outside click + Escape ---------- */
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /* ---------- Actions ---------- */
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleItemClick = (n: NotificationItem) => {
    // 1. Mark as read
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );

    // 2. Close the dropdown
    setOpen(false);

    // 3. Navigate
    if (n.href) {
      router.push(n.href);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleDismiss = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
      >
        <BellIcon className="w-[18px] h-[18px] text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0a0a0a]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {mounted &&
        open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-80 backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
            style={{
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 250,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-white">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <BellIcon className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">
                    You&apos;re all caught up
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    No new notifications.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = TYPE_META[n.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleItemClick(n)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleItemClick(n);
                        }
                      }}
                      className={`group relative w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors cursor-pointer ${
                        n.read
                          ? "hover:bg-white/5"
                          : "bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div
                          className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          <Icon className={`h-4 w-4 ${meta.color}`} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[13px] font-medium truncate ${
                                n.read ? "text-white/70" : "text-white"
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-white/50 mt-0.5 leading-relaxed line-clamp-2">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>

                        {/* Dismiss — appears on hover */}
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, n.id)}
                          className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                          aria-label="Dismiss"
                        >
                          <XMarkIcon className="h-3 w-3 text-white/40" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/notifications");
              }}
              className="w-full py-2.5 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-white/5 transition-colors border-t border-white/[0.06]"
            >
              View all notifications
            </button>
          </div>,
          document.body
        )}
    </>
  );
}