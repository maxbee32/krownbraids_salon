// app/dashboard/revenue/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  CurrencyPoundIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ChartBarIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenuePoint {
  date: string;      // YYYY-MM-DD
  revenue: number;
  bookings: number;
}

interface ServiceRevenue {
  name: string;
  revenue: number;
  bookings: number;
}

interface RevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  avgOrderValue: number;
  change: number;     // % change vs previous period
}

interface RevenueResponse {
  summary: RevenueSummary;
  daily: RevenuePoint[];
  topServices: ServiceRevenue[];
}

type RangeKey = "7d" | "30d" | "90d" | "12m";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

const COLORS = ["#22d3ee", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyFull = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

const formatShortDate = (iso: string, range: RangeKey) => {
  const d = new Date(iso);
  if (range === "12m") {
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  /* ---------- Load revenue ---------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/auth/revenue?range=${range}`);
        if (!res.ok) {
          throw new Error(`Failed to load revenue (${res.status})`);
        }

        const json = await res.json();
        const payload = json.data || json;

        const summary: RevenueSummary = payload.summary || {
          totalRevenue: payload.totalRevenue ?? 0,
          totalBookings: payload.totalBookings ?? 0,
          avgOrderValue:
            payload.totalBookings > 0
              ? (payload.totalRevenue ?? 0) / payload.totalBookings
              : 0,
          change: payload.change ?? 0,
        };

        setData({
          summary,
          daily: (payload.daily || []).map((d: any) => ({
            date: d.date,
            revenue: Number(d.revenue) || 0,
            bookings: Number(d.bookings) || 0,
          })),
          topServices: (payload.topServices || []).map((s: any) => ({
            name: s.name || s.serviceName || "Unknown",
            revenue: Number(s.revenue) || 0,
            bookings: Number(s.bookings) || 0,
          })),
        });
      } catch (err) {
        console.error("Error loading revenue:", err);
        setError(err instanceof Error ? err.message : "Failed to load revenue");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range]);

  /**
   * When the session is about to expire, clear any transient UI so the
   * session expiry warning gets the user's full attention.
   */
  useEffect(() => {
    const handler = () => {
      setError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  /* ---------- Derived ---------- */
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.daily.map((d) => ({
      ...d,
      label: formatShortDate(d.date, range),
    }));
  }, [data, range]);

  const totalBookings = data?.summary.totalBookings ?? 0;
  const totalRevenue = data?.summary.totalRevenue ?? 0;
  const avgOrder = data?.summary.avgOrderValue ?? 0;
  const change = data?.summary.change ?? 0;

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Revenue
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Track your salon&apos;s performance over time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-slate-900 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-amber-400/60 hover:text-amber-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <SummaryCard
          label="Total revenue"
          value={formatCurrency(totalRevenue)}
          icon={CurrencyPoundIcon}
          color="text-cyan-400"
          trend={change}
        />
        <SummaryCard
          label="Bookings"
          value={totalBookings.toString()}
          icon={CalendarIcon}
          color="text-emerald-400"
        />
        <SummaryCard
          label="Avg order value"
          value={formatCurrency(avgOrder)}
          icon={ChartBarIcon}
          color="text-purple-400"
        />
        <SummaryCard
          label="Change vs prev."
          value={`${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
          icon={change >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          color={change >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      {/* Revenue over time */}
      <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">
            Revenue over time
          </h2>
          <span className="text-[11px] text-white/40">
            {RANGE_OPTIONS.find((r) => r.value === range)?.label}
          </span>
        </div>

        {loading ? (
          <div className="h-[280px] rounded-xl bg-white/5 animate-pulse" />
        ) : chartData.length === 0 ? (
          <EmptyChartState message="No revenue recorded for this period." />
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickFormatter={(v) => `£${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two column: Bookings chart + Top services pie */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Bookings per period */}
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

          <h2 className="text-sm font-semibold text-white mb-5">
            Bookings
          </h2>

          {loading ? (
            <div className="h-[240px] rounded-xl bg-white/5 animate-pulse" />
          ) : chartData.length === 0 ? (
            <EmptyChartState message="No bookings in this period." />
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip valueKey="bookings" />} />
                  <Bar dataKey="bookings" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top services pie */}
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />

          <h2 className="text-sm font-semibold text-white mb-5">
            Top services by revenue
          </h2>

          {loading ? (
            <div className="h-[240px] rounded-xl bg-white/5 animate-pulse" />
          ) : !data || data.topServices.length === 0 ? (
            <EmptyChartState message="No service data yet." />
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.topServices}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="rgba(15,15,25,0.6)"
                    strokeWidth={2}
                  >
                    {data.topServices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueKey="revenue" isPie />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top services table */}
      {data && data.topServices.length > 0 && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="p-5 pb-3">
            <h2 className="text-sm font-semibold text-white">
              Service breakdown
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-white/[0.06]">
                  <th className="text-left text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Service
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Bookings
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Revenue
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-white/40 font-semibold px-5 py-3">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topServices.map((service, i) => {
                  const share =
                    totalRevenue > 0 ? (service.revenue / totalRevenue) * 100 : 0;
                  return (
                    <tr
                      key={i}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          <span className="text-sm text-white truncate">
                            {service.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-white/60">
                        {service.bookings}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-cyan-300">
                        {formatCurrencyFull(service.revenue)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-white/60">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary card                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-400",
  trend,
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
  trend?: number;
}) {
  return (
    <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {typeof trend === "number" && trend !== 0 && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              trend >= 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({
  active,
  payload,
  label,
  valueKey = "revenue",
  isPie,
}: any) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const raw = item?.payload ?? item;
  const value = item?.value ?? 0;

  return (
    <div className="backdrop-blur-2xl bg-slate-900/95 rounded-xl border border-white/10 px-3 py-2 shadow-xl shadow-black/50">
      {!isPie && label && (
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
          {label}
        </p>
      )}
      {isPie && raw?.name && (
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
          {raw.name}
        </p>
      )}
      <p className="text-sm font-semibold text-cyan-300">
        {valueKey === "revenue"
          ? formatCurrencyFull(value)
          : `${value} booking${value !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty chart state                                                  */
/* ------------------------------------------------------------------ */

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-center">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 mb-3">
        <ChartBarIcon className="h-8 w-8 text-cyan-400/60" />
      </div>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  );
}