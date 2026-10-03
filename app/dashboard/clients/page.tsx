// app/dashboard/clients/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyPoundIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string | null;
  createdAt: string;
  notes?: string;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "bookings-desc", label: "Most bookings" },
  { value: "spent-desc", label: "Highest spend" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  /* ---------- Load clients ---------- */
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/clients");
        if (!res.ok) {
          throw new Error(`Failed to load clients (${res.status})`);
        }

        const json = await res.json();
        const raw = Array.isArray(json) ? json : json.data || [];

        const mapped: Client[] = raw.map((c: any) => ({
          id: c.id,
          name: c.name || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Unnamed",
          email: c.email || "",
          phone: c.phone || c.phoneNumber || "",
          totalBookings: c.totalBookings ?? 0,
          totalSpent: Number(c.totalSpent) || 0,
          lastVisit: c.lastVisit || null,
          createdAt: c.createdAt || "",
          notes: c.notes || "",
        }));

        setClients(mapped);
      } catch (err) {
        console.error("Error loading clients:", err);
        setError(err instanceof Error ? err.message : "Failed to load clients");
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  /**
   * When the session is about to expire, close any open modal or transient
   * UI so the session expiry warning gets the user's full attention.
   */
  useEffect(() => {
    const handler = () => {
      setSelectedClient(null);
      setError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    let result = [...clients];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "bookings-desc":
        result.sort((a, b) => b.totalBookings - a.totalBookings);
        break;
      case "spent-desc":
        result.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "recent":
      default:
        result.sort((a, b) => {
          const aTime = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const bTime = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          return bTime - aTime;
        });
        break;
    }

    return result;
  }, [clients, searchTerm, sortBy]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((c) => {
        if (!c.lastVisit) return false;
        const days =
          (Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 90;
      }).length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
      avgSpend:
        clients.length > 0
          ? clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length
          : 0,
    }),
    [clients]
  );

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Clients
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Everyone who has booked with your salon.
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          label="Total clients"
          value={stats.total.toString()}
          icon={UserGroupIcon}
          color="text-cyan-400"
        />
        <StatCard
          label="Active (90d)"
          value={stats.active.toString()}
          icon={UserIcon}
          color="text-emerald-400"
        />
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={CurrencyPoundIcon}
          color="text-purple-400"
        />
        <StatCard
          label="Avg spend"
          value={formatCurrency(stats.avgSpend)}
          icon={CurrencyPoundIcon}
          color="text-cyan-400"
        />
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
        >
          {SORT_OPTIONS.map((opt) => (
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

      {/* Results count */}
      <p className="text-white/40 text-xs mb-3">
        {filtered.length} client{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Client list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
              <UserGroupIcon className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? "No matching clients" : "No clients yet"}
          </h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            {searchTerm
              ? "Try a different search term."
              : "Clients will appear here once someone books with your salon."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="w-full text-left group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all overflow-hidden p-4"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {initials(client.name) || "?"}
                </div>

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {client.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-white/40">
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        <span className="truncate max-w-[180px]">
                          {client.email}
                        </span>
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Bookings
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {client.totalBookings}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Spent
                    </p>
                    <p className="text-sm font-semibold text-cyan-300 mt-0.5">
                      {formatCurrency(client.totalSpent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      Last visit
                    </p>
                    <p className="text-sm text-white/60 mt-0.5">
                      {formatDate(client.lastVisit)}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Client detail modal */}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-400",
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
}) {
  return (
    <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client detail modal                                                */
/* ------------------------------------------------------------------ */

function ClientModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-lg my-0 sm:my-8 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <p className="text-xs uppercase tracking-wider text-white/40 font-medium">
            Client details
          </p>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center text-white text-lg font-semibold">
              {initials(client.name) || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">
                {client.name}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Client since {formatDate(client.createdAt)}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            {client.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <EnvelopeIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
                <span className="text-white/80 truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <PhoneIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
                <span className="text-white/80">{client.phone}</span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <CalendarIcon className="h-4 w-4 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-white">
                {client.totalBookings}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                Bookings
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <CurrencyPoundIcon className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-white">
                {formatCurrency(client.totalSpent)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                Spent
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <CalendarIcon className="h-4 w-4 text-purple-400 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-white mt-1">
                {formatDate(client.lastVisit)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                Last visit
              </p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">
                Notes
              </p>
              <p className="text-sm text-white/70 leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}