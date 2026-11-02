// components/dashboard/TopBar.tsx
"use client";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

interface TopBarProps {
  pageLabel: string;
  status?: { label: string; color: string; bg: string; icon: any } | null;
  onOpenSidebar: () => void;
  userInitial?: string;
  userName?: string;
}

export function TopBar({
  pageLabel,
  status,
  onOpenSidebar,
  userInitial,
  userName,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/5 border-b border-white/10">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-16">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white/70 flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="hidden md:block min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/30 font-semibold">
              Dashboard
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {pageLabel}
            </p>
          </div>
          {/* Mobile: just the page label */}
          <p className="md:hidden text-sm font-semibold text-white truncate">
            {pageLabel}
          </p>
        </div>

        {/* Right: status + bell + profile */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {status && (
            <span
              className={`hidden sm:inline-flex ${status.bg} ${status.color} text-[11px] font-medium px-2.5 py-1 rounded-full border items-center gap-1.5 whitespace-nowrap`}
            >
              <status.icon className="h-3 w-3" />
              {status.label}
            </span>
          )}

          <NotificationBell />

          <button
            onClick={() => router.push("/dashboard/settings")}
            className="group flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            aria-label="Open profile settings"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
              {userInitial ? (
                <span className="text-[12px] font-semibold text-white">
                  {userInitial.toUpperCase()}
                </span>
              ) : (
                <UserCircleIcon className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            {userName && (
              <span className="hidden md:block text-[13px] font-medium text-white/80 max-w-[120px] truncate">
                {userName}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}