// components/dashboard/SessionExpiryModal.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export function SessionExpiryModal({
  open,
  msRemaining,
  onStay,
  onLogout,
}: {
  open: boolean;
  msRemaining: number;
  onStay: () => Promise<void> | void;
  onLogout: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [extending, setExtending] = useState(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Escape key → treat as "stay signed in" */
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !extending) {
        e.preventDefault();
        void handleStay();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, extending]);

  /* Auto-focus the stay button when the modal opens */
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      stayButtonRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted || !open) return null;

  const seconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeLabel =
    minutes > 0
      ? `${minutes}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;

  /* Color escalates as time runs out */
  const isCritical = seconds <= 30;
  const isWarning = seconds > 30 && seconds <= 90;
  const timerColor = isCritical
    ? "text-red-400"
    : isWarning
    ? "text-amber-300"
    : "text-emerald-300";

  const barColor = isCritical
    ? "via-red-400"
    : isWarning
    ? "via-amber-400"
    : "via-emerald-400";

  const handleStay = async () => {
    setExtending(true);
    try {
      await onStay();
    } finally {
      setExtending(false);
    }
  };

  /* Trap focus inside the modal */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;

    const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
      "button:not([disabled])"
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
      onKeyDown={handleKeyDown}
    >
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-md my-0 sm:my-8 shadow-2xl shadow-black/50">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${barColor} to-transparent rounded-t-3xl transition-colors duration-500`}
        />

        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                isCritical
                  ? "bg-red-500/15 border-red-500/30"
                  : isWarning
                  ? "bg-amber-500/15 border-amber-500/30"
                  : "bg-emerald-500/15 border-emerald-500/30"
              }`}
            >
              <ClockIcon
                className={`h-5 w-5 transition-colors ${
                  isCritical
                    ? "text-red-400"
                    : isWarning
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="session-expiry-title"
                className="text-base font-semibold text-white"
              >
                Session expiring soon
              </h2>
              <p className="text-sm text-white/50 mt-1 leading-relaxed">
                You&apos;ll be signed out in{" "}
                <span
                  className={`font-semibold tabular-nums transition-colors ${timerColor}`}
                >
                  {timeLabel}
                </span>
                . Would you like to stay on this page?
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/[0.06]">
            <button
              onClick={onLogout}
              disabled={extending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign out now
            </button>
            <button
              ref={stayButtonRef}
              onClick={handleStay}
              disabled={extending}
              className="flex-1 relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden group disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center gap-2">
                {extending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <ClockIcon className="h-4 w-4" />
                )}
                {extending ? "Extending…" : "Stay signed in"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}