// lib/useSessionExpiry.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTokenExpiry } from "./jwt";

interface SessionState {
  expiresAt: number | null;
  msRemaining: number;
  showWarning: boolean;
}

const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // show warning 2 minutes before expiry

export function useSessionExpiry() {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    expiresAt: null,
    msRemaining: 0,
    showWarning: false,
  });

  const refresh = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const msRemaining = expiry - Date.now();
    setState({
      expiresAt: expiry,
      msRemaining,
      showWarning: msRemaining <= WARNING_THRESHOLD_MS && msRemaining > 0,
    });
  }, []);

  // Initial read
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        // No token at all → kick them out
        router.push("/login");
        return;
      }

      const expiry = getTokenExpiry(token);
      if (!expiry) {
        router.push("/login");
        return;
      }

      const msRemaining = expiry - Date.now();

      if (msRemaining <= 0) {
        // Hard expired → clear and redirect
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        router.push("/login?reason=expired");
        return;
      }

      setState({
        expiresAt: expiry,
        msRemaining,
        showWarning: msRemaining <= WARNING_THRESHOLD_MS,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return { ...state, refresh };
}