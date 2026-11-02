// app/dashboard/marketplace/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Image URL normaliser — keeps supplier paths pointing at our proxy  */
/* ------------------------------------------------------------------ */

const proxyImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("/api/uploads/")) return url;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("data:")) return url;

  const suppliersIdx = url.indexOf("/images/suppliers/");
  if (suppliersIdx !== -1) {
    const rest = url.substring(suppliersIdx + "/images/suppliers/".length);
    const clean = rest.startsWith("products/")
      ? rest.slice("products/".length)
      : rest;
    return `/api/uploads/${clean}`;
  }

  const uploadsProductsIdx = url.indexOf("/uploads/products/");
  if (uploadsProductsIdx !== -1) {
    return `/api/uploads/${url.substring(
      uploadsProductsIdx + "/uploads/products/".length
    )}`;
  }

  if (url.startsWith("/uploads/")) return `/api${url}`;
  if (url.startsWith("uploads/")) return `/api/${url}`;

  const bareMatch = url.match(
    /^\/?([a-zA-Z0-9_-]+)\/([^/]+\.(?:jpe?g|png|webp|gif|avif|svg))$/i
  );
  if (bareMatch) {
    return `/api/uploads/${bareMatch[1]}/${bareMatch[2]}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  return url;
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderSummary {
  id: number;
  orderNumber: string;
  status: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
  supplierId: string;
  thumbnailUrl?: string;
  firstItemName?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number, currency: string = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_META: Record<
  OrderSummary["status"],
  { label: string; color: string; bg: string; icon: typeof ClockIcon }
> = {
  PENDING_PAYMENT: {
    label: "Awaiting payment",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: ClockIcon,
  },
  PAID: {
    label: "Paid",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircleIcon,
  },
  FULFILLED: {
    label: "Shipped",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    icon: TruckIcon,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: XCircleIcon,
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-white/50",
    bg: "bg-white/5 border-white/10",
    icon: XCircleIcon,
  },
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "FULFILLED", label: "Shipped" },
  { value: "CANCELLED", label: "Cancelled" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SalonOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not signed in");

      const qs = new URLSearchParams();
      if (statusFilter) qs.set("status", statusFilter);
      qs.set("page", String(page));
      qs.set("size", "20");

      const res = await fetch(`/api/auth/marketplace/orders?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.message || "Failed to load orders");
      }

      const json = await res.json();
      setOrders(json.content ?? []);
      setTotalPages(json.totalPages ?? 1);
    } catch (err: any) {
      setError(err.message ?? "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-cyan-300 transition-colors mb-3"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to marketplace
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Your orders
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Track deliveries and view past purchases from suppliers.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(0);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
              statusFilter === f.value
                ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-300"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={loadOrders}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-16 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="flex justify-center mb-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
              <ShoppingBagIcon className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {statusFilter ? "No orders with this status" : "No orders yet"}
          </h3>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
            {statusFilter
              ? "Try a different filter or view all orders."
              : "When you order from the marketplace, your purchases will appear here."}
          </p>
          <Link
            href="/dashboard/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.PENDING_PAYMENT;
            const StatusIcon = meta.icon;
            // Normalise the thumbnail so the browser hits our /api/uploads proxy
            const thumbSrc = proxyImageUrl(order.thumbnailUrl);

            return (
              <Link
                key={order.id}
                href={`/dashboard/marketplace/orders/${order.orderNumber}`}
                className="block relative rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all p-4 md:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={order.firstItemName ?? "Order item"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // If the proxy 404s, fall back to a neutral state
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs text-white/40 mb-0.5">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm font-semibold text-white truncate">
                          {order.firstItemName ?? "Multiple items"}
                          {order.itemCount > 1 && (
                            <span className="text-white/40 font-normal">
                              {" "}+ {order.itemCount - 1} more
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-white tabular-nums">
                          {formatCurrency(order.total, order.currency)}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${meta.bg} ${meta.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-white/50">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}