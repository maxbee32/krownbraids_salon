// components/dashboard/TopBar.tsx
"use client";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

interface TopBarProps {
  pageLabel: string;
  status?: { label: string; color: string; bg: string; icon: any } | null;
  onOpenSidebar: () => void;
}

export function TopBar({ pageLabel, status, onOpenSidebar }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/5 border-b border-white/10">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white/70"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <p className="text-[13px] text-white/50">{pageLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            aria-label="Profile"
          >
            <UserCircleIcon className="w-[18px] h-[18px] text-white/70" />
          </button>
        </div>
      </div>
    </header>
  );
}