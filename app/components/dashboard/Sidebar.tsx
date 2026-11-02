// components/dashboard/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CogIcon,
  XMarkIcon,
  ScissorsIcon,
  ArrowRightOnRectangleIcon,
  LifebuoyIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  UserGroupIcon as UserGroupSolid,
  ChartBarIcon as ChartBarSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  CreditCardIcon as CreditCardSolid,
  CogIcon as CogSolid,
  ScissorsIcon as ScissorsSolid,
  LifebuoyIcon as LifebuoySolid,
  ClipboardDocumentListIcon as ClipboardDocumentListSolid,
} from "@heroicons/react/24/solid";
import { Logo } from "../ui/Logo";

export interface SidebarSalon {
  id: number;
  name: string;
  city?: string;
  address?: string;
  selectedPlanId: number | null;
  planName?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
}

interface SidebarProps {
  salon: SidebarSalon | null;
  status?: string;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

const getDaysRemaining = (salon: SidebarSalon | null): number => {
  if (!salon?.subscriptionEndDate) return 0;
  const end = new Date(salon.subscriptionEndDate).getTime();
  if (isNaN(end)) return 0;
  const diffMs = end - Date.now();
  if (diffMs <= 0) return 0;
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
};

const ACTIVE_STATUSES = ["APPROVED", "ACTIVE", "COMPLETED"];
const PENDING_STATUSES = ["PENDING_APPROVAL", "PENDING", "REVIEW"];
const REJECTED_STATUSES = ["REJECTED", "DECLINED"];

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: HomeIcon,
    activeIcon: HomeSolid,
    exact: true,
  },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: CalendarIcon,
    activeIcon: CalendarSolid,
  },
  {
    href: "/dashboard/services",
    label: "Services",
    icon: ScissorsIcon,
    activeIcon: ScissorsSolid,
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: UserGroupIcon,
    activeIcon: UserGroupSolid,
  },
  {
    href: "/dashboard/revenue",
    label: "Revenue",
    icon: ChartBarIcon,
    activeIcon: ChartBarSolid,
  },
  {
    href: "/dashboard/marketplace",
    label: "Marketplace",
    icon: ShoppingBagIcon,
    activeIcon: ShoppingBagSolid,
    // Match only the marketplace root, NOT /marketplace/orders
    exact: true,
  },
  {
    href: "/dashboard/marketplace/orders",
    label: "Orders",
    icon: ClipboardDocumentListIcon,
    activeIcon: ClipboardDocumentListSolid,
  },
  {
    href: "/dashboard/subscription",
    label: "Subscription",
    icon: CreditCardIcon,
    activeIcon: CreditCardSolid,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: CogIcon,
    activeIcon: CogSolid,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    icon: LifebuoyIcon,
    activeIcon: LifebuoySolid,
  },
];

const ALWAYS_ALLOWED_PENDING = [
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/support",
];

const ALWAYS_ALLOWED_REJECTED = [
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/support",
];

const isNavItemVisible = (href: string, status?: string): boolean => {
  if (!status) return true;
  if (ACTIVE_STATUSES.includes(status)) return true;
  if (PENDING_STATUSES.includes(status)) {
    return ALWAYS_ALLOWED_PENDING.includes(href);
  }
  if (REJECTED_STATUSES.includes(status)) {
    return ALWAYS_ALLOWED_REJECTED.includes(href);
  }
  return false;
};

export function Sidebar({ salon, status, onLogout, open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const daysRemaining = getDaysRemaining(salon);

  const planName =
    salon?.planName?.trim() ||
    (salon?.selectedPlanId ? "Active Plan" : "Trial");

  const hasSubscription = Boolean(salon?.subscriptionEndDate);
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    // Non-exact: match the href and any descendant, but never match a
    // sibling longer path that also starts with this prefix. E.g.
    // "/dashboard/marketplace" should not highlight when on "/dashboard/marketplace/orders".
    if (pathname === href) return true;
    return pathname.startsWith(href + "/");
  };

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    isNavItemVisible(item.href, status)
  );

  const isRestricted =
    status &&
    (PENDING_STATUSES.includes(status) || REJECTED_STATUSES.includes(status));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 backdrop-blur-2xl bg-white/5 border-r border-white/10 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/[0.06]">
          <Logo href="/dashboard" />
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/50"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Salon identity */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <span className="text-[15px] font-semibold text-white/90">
                {(salon?.name?.trim()?.[0] || "K").toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {salon?.name || "Your salon"}
              </p>
              <p className="text-[11px] text-white/40 truncate">
                {salon?.city || salon?.address || "No address set"}
              </p>
            </div>
          </div>
        </div>

        {/* Plan card — hidden for pending/rejected */}
        {!isRestricted && (
          <div className="mx-4 mt-3 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
                {planName}
                {planName.toLowerCase() === "trial" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </span>
              {!hasSubscription ? (
                <span className="text-[10px] text-white/40 font-medium">
                  No plan
                </span>
              ) : daysRemaining > 0 ? (
                <span className="text-[10px] text-emerald-400 font-medium">
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-red-400 font-medium">
                  Expired
                </span>
              )}
            </div>

            <p className="text-xs text-white/60">
              {!hasSubscription ? (
                "No active subscription"
              ) : daysRemaining > 0 ? (
                <>
                  <span
                    className={`font-semibold ${
                      isExpiringSoon ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </span>{" "}
                  remaining
                </>
              ) : (
                "Renew to continue"
              )}
            </p>

            {isExpiringSoon && (
              <p className="text-[10px] text-amber-400/80 mt-1.5">
                Renews soon — update your plan
              </p>
            )}

            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="mt-3 w-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all"
            >
              {!hasSubscription
                ? "Choose a plan"
                : planName.toLowerCase() === "trial"
                ? "Upgrade plan"
                : "Manage subscription"}
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 px-3 mb-2">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {visibleNavItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = active ? item.activeIcon : item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all group border ${
                      active
                        ? "bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-white border-cyan-400/20"
                        : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] transition-colors flex-shrink-0 ${
                        active
                          ? "text-cyan-400"
                          : "text-white/40 group-hover:text-cyan-400"
                      }`}
                    />
                    <span className={active ? "font-medium" : ""}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}