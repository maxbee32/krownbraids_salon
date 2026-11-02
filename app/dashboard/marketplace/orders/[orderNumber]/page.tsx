// app/dashboard/marketplace/orders/[orderNumber]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Image URL normaliser                                               */
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

interface OrderItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  deliveredAt?: string | null;   // ← NEW
  paymentReference: string | null;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingNotes?: string;
  items: OrderItem[];
  trackingNumber?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (a: number, c = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(a);

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

/* ------------------------------------------------------------------ */
/*  Courier link helper                                                */
/* ------------------------------------------------------------------ */

function trackingUrl(trackingNumber: string | null | undefined): string | null {
  if (!trackingNumber) return null;
  const t = trackingNumber.toUpperCase().trim();

  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(t)) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${t}`;
  }
  if (/^\d{14}$/.test(t)) {
    return `https://track.dpd.co.uk/parcels/${t}`;
  }
  if (/^\d{16}$/.test(t)) {
    return `https://www.evri.com/track/parcel/${t}`;
  }
  if (/^1Z[A-Z0-9]{16}$/.test(t)) {
    return `https://www.ups.com/track?tracknum=${t}`;
  }
  if (/^\d{12}$/.test(t)) {
    return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

function statusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "PENDING_PAYMENT": return "Awaiting payment";
    case "PAID":            return "Paid";
    case "FULFILLED":       return "Shipped";
    case "DELIVERED":       return "Delivered";
    case "CANCELLED":       return "Cancelled";
    case "REFUNDED":        return "Refunded";
    default:                return status ?? "—";
  }
}

function statusBadge(status: string): string {
  switch (status?.toUpperCase()) {
    case "DELIVERED":       return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "FULFILLED":       return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "PAID":            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "PENDING_PAYMENT": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "CANCELLED":
    case "REFUNDED":        return "bg-red-500/10 text-red-400 border-red-500/20";
    default:                return "bg-white/5 text-white/60 border-white/10";
  }
}

function StatusIcon({ status }: { status: string }) {
  const cls = "h-3.5 w-3.5";
  switch (status?.toUpperCase()) {
    case "DELIVERED":       return <CheckCircleIcon className={cls} />;
    case "FULFILLED":       return <TruckIcon className={cls} />;
    case "PAID":
    case "PENDING_PAYMENT": return <ClockIcon className={cls} />;
    case "CANCELLED":
    case "REFUNDED":        return <XCircleIcon className={cls} />;
    default:                return <ClockIcon className={cls} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(
          `/api/auth/marketplace/orders/${encodeURIComponent(orderNumber)}`,
          {
            headers: { Authorization: `Bearer ${token ?? ""}` },
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error("Order not found");
        setOrder(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderNumber]);

  /* ---------- Confirm receipt ---------- */
  const handleConfirmReceived = async () => {
    if (!order) return;
    setConfirming(true);
    setConfirmError(null);

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `/api/auth/marketplace/orders/${encodeURIComponent(
          order.orderNumber
        )}/confirm-received`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token ?? ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to confirm receipt (${res.status})`);
      }

      // Re-fetch so status, banner, timeline, and button all update
      const refreshed = await fetch(
        `/api/auth/marketplace/orders/${encodeURIComponent(order.orderNumber)}`,
        {
          headers: { Authorization: `Bearer ${token ?? ""}` },
          cache: "no-store",
        }
      );
      if (refreshed.ok) {
        setOrder(await refreshed.json());
      }
    } catch (err: any) {
      setConfirmError(err.message ?? "Could not confirm receipt");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-white/40">Loading order…</div>;
  }
  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <p className="text-white/60">{error ?? "Order not found"}</p>
        <Link
          href="/dashboard/marketplace/orders"
          className="text-cyan-400 text-sm hover:underline mt-4 inline-block"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const shipped = !!order.fulfilledAt;
  const delivered =
    order.status?.toUpperCase() === "DELIVERED" || !!order.deliveredAt;
  const courierLink = trackingUrl(order.trackingNumber);
  const canConfirm =
    !delivered && order.status?.toUpperCase() === "FULFILLED";

  return (
    <>
      <Link
        href="/dashboard/marketplace/orders"
        className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-cyan-300 transition-colors mb-4"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All orders
      </Link>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Order #{order.orderNumber}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border self-start sm:self-auto ${statusBadge(
            order.status
          )}`}
        >
          <StatusIcon status={order.status} />
          {statusLabel(order.status)}
        </span>
      </div>

      {/* On the way / Delivered banner */}
      {shipped && (
        <div
          className={`mb-6 relative overflow-hidden rounded-2xl border p-5 ${
            delivered
              ? "border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10"
              : "border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
          }`}
        >
          <div
            className={`absolute top-0 left-0 right-0 h-px ${
              delivered
                ? "bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                : "bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            }`}
          />
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                delivered
                  ? "bg-emerald-500/15 border border-emerald-400/30"
                  : "bg-cyan-500/15 border border-cyan-400/30"
              }`}
            >
              {delivered ? (
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
              ) : (
                <TruckIcon className="h-5 w-5 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white">
                {delivered ? "Order delivered" : "Your order is on the way"}
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Dispatched {formatDate(order.fulfilledAt)}
              </p>
              {delivered && (
                <p className="text-sm text-white/60 mt-0.5">
                  Confirmed received {formatDate(order.deliveredAt)}
                </p>
              )}
              {order.trackingNumber && (
                <p className="text-sm text-white/60 mt-1">
                  Tracking number:{" "}
                  {courierLink ? (
                    <a
                      href={courierLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 font-mono font-semibold hover:underline"
                    >
                      {order.trackingNumber}
                    </a>
                  ) : (
                    <span className="text-cyan-300 font-mono font-semibold">
                      {order.trackingNumber}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm receipt CTA — only when shipped and not yet delivered */}
      {canConfirm && (
        <div className="mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white mb-2">
            Received your order?
          </h2>
          <p className="text-xs text-white/50 mb-3">
            Confirming receipt lets the supplier know the goods arrived safely and
            releases their payout.
          </p>

          {confirmError && (
            <p className="text-xs text-red-400 mb-2">{confirmError}</p>
          )}

          <button
            onClick={handleConfirmReceived}
            disabled={confirming}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {confirming ? "Confirming…" : "Confirm Receipt"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => {
                const src = proxyImageUrl(item.imageUrl);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                      {src ? (
                        <img
                          src={src}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-white/40">
                        {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white tabular-nums">
                      {formatCurrency(item.lineTotal, order.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Shipping to</h2>
            <p className="text-sm text-white">{order.shippingName}</p>
            <p className="text-sm text-white/60 mt-1">{order.shippingAddress}</p>
            <p className="text-sm text-white/60">
              {order.shippingCity}, {order.shippingPostalCode}
            </p>
            <p className="text-sm text-white/60">{order.shippingCountry}</p>
            {order.shippingNotes && (
              <p className="text-xs text-white/40 mt-2 italic">
                Note: {order.shippingNotes}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">
                  {formatCurrency(order.subtotal, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Shipping</span>
                <span className="text-white">
                  {formatCurrency(order.shipping, order.currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-white">
                  {formatCurrency(order.total, order.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Timeline</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80">Order placed</p>
                  <p className="text-white/40 mt-0.5">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              {order.paidAt && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80">Payment confirmed</p>
                    <p className="text-white/40 mt-0.5">
                      {formatDate(order.paidAt)}
                    </p>
                  </div>
                </div>
              )}
              {order.fulfilledAt && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80">Shipped</p>
                    <p className="text-white/40 mt-0.5">
                      {formatDate(order.fulfilledAt)}
                    </p>
                  </div>
                </div>
              )}
              {delivered && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80">Delivered</p>
                    <p className="text-white/40 mt-0.5">
                      {formatDate(order.deliveredAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {order.paymentReference && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
              <h2 className="text-sm font-semibold text-white mb-2">Payment</h2>
              <p className="text-xs text-white/40 break-all">
                {order.paymentReference}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}