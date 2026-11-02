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
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Maps 1:1 to the backend's NotificationType enum. */
type BackendNotificationType =
  | "NEW_ADMIN_REGISTERED"
  | "SALON_OWNER_EMAIL_VERIFICATION"
  | "SALON_OWNER_OTP"
  | "PAYMENT_CONFIRMATION"
  | "ADMIN_SALON_REGISTRATION"
  | "SUPPLIER_EMAIL_VERIFICATION"
  | "SUPPLIER_PASSWORD_RESET"
  | "SUPPLIER_REJECTED"
  | "SUPPLIER_APPROVED"
  | "SALON_APPROVED"
  | "SALON_REJECTED";

interface ApiNotification {
  id: number;
  eventId: string;
  type: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  recipientType: string; // "SALON" | "SUPPLIER" | "ADMIN"
}

interface NotificationListResponse {
  notifications: ApiNotification[];
  unread: number;
}

/* ------------------------------------------------------------------ */
/*  Visual mapping — backend type → icon + colour                      */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  string,
  { icon: any; color: string; bg: string; border: string; href?: string }
> = {
  // Salon owner lifecycle
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

  // Suppliers
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
  SUPPLIER_EMAIL_VERIFICATION: {
    icon: ExclamationTriangleIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  SUPPLIER_PASSWORD_RESET: {
    icon: CreditCardIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },

  // Admin
  NEW_ADMIN_REGISTERED: {
    icon: ShoppingBagIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  ADMIN_SALON_REGISTRATION: {
    icon: ShoppingBagIcon,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    href: "/dashboard/admin/salons",
  },
};

const FALLBACK_META = {
  icon: BellIcon,
  color: "text-white/60",
  bg: "bg-white/5",
  border: "border-white/10",
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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  /* ------------------------------------------------------------------ */
  /*  Fetch notifications from the backend                               */
  /* ------------------------------------------------------------------ */

  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      setLoading(true);

      // Adjust path if your Next.js proxy is at a different route
      const res = await fetch("/api/auth/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("Failed to fetch notifications:", res.status);
        return;
      }

      const data: NotificationListResponse = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch (err) {
      console.warn("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Initial fetch + polling ---------- */

  useEffect(() => {
    setMounted(true);
    fetchNotifications();

    // Poll every 60s so the badge stays fresh
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ---------- Refetch whenever the dropdown opens ---------- */

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

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

  /* ------------------------------------------------------------------ */
  /*  Actions                                                            */
  /* ------------------------------------------------------------------ */

  const handleItemClick = async (n: ApiNotification) => {
    // Optimistic UI
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, read: true } : item
        )
      );
      setUnread((u) => Math.max(0, u - 1));

      // Fire and forget — don't block navigation
      const token = localStorage.getItem("adminToken");
      if (token) {
        fetch(`/api/auth/notifications/${n.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
          // If it fails, the next poll will reconcile
        });
      }
    }

    setOpen(false);

    const meta = TYPE_META[n.type as string] ?? FALLBACK_META;
    if (meta.href) {
      router.push(meta.href);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic UI
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
      // Next poll will reconcile
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Derived                                                            */
  /* ------------------------------------------------------------------ */

  const visibleNotifications = useMemo(
    () => notifications.slice(0, 20),
    [notifications]
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <BellIcon className="w-[18px] h-[18px] text-white/70" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0a0a0a]">
            {unread > 9 ? "9+" : unread}
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
                {unread > 0 && (
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
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
              {loading && visibleNotifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-purple-500/30 border-t-cyan-400" />
                  <p className="text-xs text-white/40 mt-3">Loading…</p>
                </div>
              ) : visibleNotifications.length === 0 ? (
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
                visibleNotifications.map((n) => {
                  const meta =
                    TYPE_META[n.type as string] ?? FALLBACK_META;
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
                      className={`w-full text-left px-4 py-3 border-b border-white/[0.04] transition-colors cursor-pointer ${
                        n.read
                          ? "hover:bg-white/5"
                          : "bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          <Icon className={`h-4 w-4 ${meta.color}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[13px] font-medium truncate ${
                                n.read ? "text-white/70" : "text-white"
                              }`}
                            >
                              {n.subject}
                            </p>
                            {!n.read && (
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-white/50 mt-0.5 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
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