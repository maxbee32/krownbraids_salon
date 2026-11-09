// app/dashboard/bookings/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  CurrencyPoundIcon,
  ScissorsIcon,
  CheckIcon,
  NoSymbolIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
  PhotoIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { resolveBookingImageUrl } from "@/lib/imageUrl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  salonId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  paymentStatus?: string | null;
  referenceImages?: string[] | null;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
type ViewMode = 'upcoming' | 'day';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (isoDate: string, delta: number) => {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toISODate(d);
};

const formatLongDate = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatShortDate = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (time: string) => {
  if (time.includes(':')) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m.slice(0, 2)} ${ampm}`;
  }
  return time;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

const isToday = (isoDate: string) => isoDate === toISODate(new Date());

const relativeDayLabel = (isoDate: string) => {
  const today = toISODate(new Date());
  if (isoDate === today) return 'Today';
  if (isoDate === addDays(today, 1)) return 'Tomorrow';
  if (isoDate === addDays(today, -1)) return 'Yesterday';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
};

const mapBackendStatus = (s: string): Booking['status'] => {
  const u = (s ?? '').toUpperCase();
  if (u === 'PENDING') return 'pending';
  if (u === 'CONFIRMED') return 'confirmed';
  if (u === 'COMPLETED') return 'completed';
  if (u === 'CANCELLED' || u === 'REJECTED') return 'cancelled';
  if (u === 'NO_SHOW') return 'no-show';
  return 'pending';
};

const toBackendStatus = (s: Booking['status']): string => {
  switch (s) {
    case 'pending': return 'PENDING';
    case 'confirmed': return 'CONFIRMED';
    case 'completed': return 'COMPLETED';
    case 'cancelled': return 'CANCELLED';
    case 'no-show': return 'COMPLETED';
    default: return 'PENDING';
  }
};

const STATUS_META: Record<
  Booking['status'],
  { label: string; text: string; bg: string; border: string; dot: string; icon: any }
> = {
  pending:   { label: 'Pending',   text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   icon: ClockIcon },
  confirmed: { label: 'Confirmed', text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    dot: 'bg-cyan-400',    icon: CheckIconSolid },
  completed: { label: 'Completed', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelled', text: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     dot: 'bg-red-400',     icon: XCircleIcon },
  'no-show': { label: 'No-show',   text: 'text-white/50',    bg: 'bg-white/5',        border: 'border-white/15',       dot: 'bg-white/40',    icon: NoSymbolIcon },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));

  useEffect(() => { fetchBookings(); }, []);

  useEffect(() => {
    const handler = () => {
      setSelectedBooking(null);
      setSuccessMessage(null);
      setError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { router.push('/login'); return; }

      const res = await fetch('/api/auth/bookings/salon', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Failed to load bookings');

      const data: any[] = await res.json();

      const mapped: Booking[] = data.map((b) => ({
        id: String(b.id),
        serviceId: b.serviceId ?? '',
        serviceName: b.serviceName ?? '',
        salonId: String(b.salonId ?? ''),
        clientName: b.customerName ?? '',
        clientEmail: b.customerEmail ?? '',
        clientPhone: b.customerPhone ?? '',
        date: b.appointmentDate ?? '',
        time: (b.appointmentTime ?? '').slice(0, 5),
        duration: b.durationMinutes ?? 0,
        amount: Number(b.servicePrice ?? 0),
        status: mapBackendStatus(b.status),
        notes: b.notes ?? '',
        paymentStatus: b.paymentStatus ?? null,
        referenceImages: b.referenceImages ?? null,
      }));

      setBookings(mapped);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const today = toISODate(new Date());

  const visibleBookings = useMemo(() => {
    if (viewMode === 'upcoming') {
      return bookings
        .filter((b) => b.date >= today)
        .sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date);
          return dateCmp !== 0 ? dateCmp : a.time.localeCompare(b.time);
        });
    }

    return bookings
      .filter((b) => b.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, selectedDate, viewMode, today]);

  const stats = useMemo(() => ({
    total: visibleBookings.length,
    pending: visibleBookings.filter((b) => b.status === 'pending').length,
    confirmed: visibleBookings.filter((b) => b.status === 'confirmed').length,
    completed: visibleBookings.filter((b) => b.status === 'completed').length,
    cancelled: visibleBookings.filter((b) => b.status === 'cancelled').length,
    noShow: visibleBookings.filter((b) => b.status === 'no-show').length,
    revenue: visibleBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.amount, 0),
  }), [visibleBookings]);

  const filteredBookings = useMemo(() => {
    let result = [...visibleBookings];
    if (activeTab !== 'all') result = result.filter((b) => b.status === activeTab);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.clientName.toLowerCase().includes(t) ||
          b.serviceName.toLowerCase().includes(t) ||
          b.clientEmail.toLowerCase().includes(t) ||
          b.clientPhone.includes(t)
      );
    }
    return result;
  }, [visibleBookings, activeTab, searchTerm]);

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `/api/auth/bookings/salon/${bookingId}/status?status=${toBackendStatus(newStatus)}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update');
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      setSuccessMessage(`Booking marked as ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading bookings</p>
        </div>
      </div>
    );
  }

  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { id: 'no-show', label: 'No-show', count: stats.noShow },
  ];

  const upcomingCount = bookings.filter((b) => b.date >= today).length;
  const todayCount = bookings.filter((b) => b.date === today).length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Bookings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {viewMode === 'upcoming'
              ? 'All upcoming appointments, most recent first.'
              : 'Manage your appointment diary, day by day.'}
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
            viewMode === 'upcoming'
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
          }`}
        >
          Upcoming
          {upcomingCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              viewMode === 'upcoming' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-white/40'
            }`}>
              {upcomingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode('day')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
            viewMode === 'day'
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
          }`}
        >
          Day view
          {todayCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              viewMode === 'day' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-white/40'
            }`}>
              {todayCount} today
            </span>
          )}
        </button>
      </div>

      {/* Date navigator — only in Day view */}
      {viewMode === 'day' && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-4 md:p-5 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold">
                  {relativeDayLabel(selectedDate)}
                </p>
                <p className="text-sm text-white/60 mt-0.5 truncate">
                  {formatLongDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Previous day">
                  <ChevronLeftIcon className="h-4 w-4 text-white/70" />
                </button>
                <button
                  onClick={() => setSelectedDate(today)}
                  disabled={isToday(selectedDate)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isToday(selectedDate)
                      ? 'text-white/30 cursor-not-allowed'
                      : 'text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  Today
                </button>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Next day">
                  <ChevronRightIcon className="h-4 w-4 text-white/70" />
                </button>
              </div>

              <label className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all [color-scheme:dark]"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          label={viewMode === 'upcoming' ? 'Upcoming bookings' : (isToday(selectedDate) ? "Today's bookings" : 'Total on this day')}
          value={stats.total.toString()}
          icon={CalendarIcon}
          color="text-cyan-400"
        />
        <StatCard label="Pending approval" value={stats.pending.toString()} icon={ClockIcon} color="text-amber-400" />
        <StatCard label="Confirmed" value={stats.confirmed.toString()} icon={CheckIconSolid} color="text-cyan-400" />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} icon={BanknotesIcon} color="text-emerald-400" />
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder={
              viewMode === 'upcoming'
                ? 'Search upcoming by client, service, email, or phone…'
                : 'Search this day by client, service, email, or phone…'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.id ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-white/40'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          viewMode={viewMode}
          date={selectedDate}
          hasSearch={searchTerm.trim().length > 0}
          hasFilter={activeTab !== 'all'}
        />
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              viewMode={viewMode}
              onView={() => setSelectedBooking(booking)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
          onRefresh={fetchBookings}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/5"><Icon className={`h-5 w-5 ${color}`} /></div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function BookingRow({
  booking,
  viewMode,
  onView,
  onStatusChange,
}: {
  booking: Booking;
  viewMode: ViewMode;
  onView: () => void;
  onStatusChange: (id: string, s: Booking['status']) => void;
}) {
  const meta = STATUS_META[booking.status];
  const StatusIcon = meta.icon;
  const showDate = viewMode === 'upcoming' && !isToday(booking.date);

  return (
    <div className="group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/20 transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-1 lg:w-24 flex-shrink-0">
          <div className="text-lg font-semibold text-cyan-300 font-mono">{formatTime(booking.time)}</div>
          {showDate ? (
            <div className="text-[11px] text-cyan-400/80 font-medium">{formatShortDate(booking.date)}</div>
          ) : (
            <div className="text-[11px] text-white/40">{booking.duration} min</div>
          )}
          {showDate && (
            <div className="text-[10px] text-white/30">{booking.duration} min</div>
          )}
        </div>
        <div className="hidden lg:block w-px h-14 bg-white/10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-white truncate">{booking.clientName}</h4>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}>
                  <StatusIcon className="h-3 w-3" />{meta.label}
                </span>
                {booking.referenceImages && booking.referenceImages.length > 0 && (
                  <span className="text-[10px] text-cyan-300/80 flex items-center gap-1">
                    <PhotoIcon className="h-3 w-3" />
                    {booking.referenceImages.length}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm truncate mt-0.5">{booking.serviceName}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/40 mt-1.5">
                <span className="flex items-center gap-1"><EnvelopeIcon className="h-3 w-3" /><span className="hidden sm:inline">{booking.clientEmail}</span><span className="sm:hidden">Email</span></span>
                <span className="flex items-center gap-1"><PhoneIcon className="h-3 w-3" /><span className="hidden sm:inline">{booking.clientPhone}</span><span className="sm:hidden">Phone</span></span>
                <span className="flex items-center gap-1 text-cyan-300"><CurrencyPoundIcon className="h-3 w-3" />{formatCurrency(booking.amount)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === 'pending' && (
            <>
              <ActionButton onClick={() => onStatusChange(booking.id, 'confirmed')} variant="success" icon={CheckIcon} label="Confirm" />
              <ActionButton onClick={() => onStatusChange(booking.id, 'cancelled')} variant="danger" icon={XCircleIcon} label="Cancel" />
            </>
          )}
          {booking.status === 'confirmed' && (
            // Completion goes through the OTP modal. Row-level only offers Cancel.
            <ActionButton onClick={() => onStatusChange(booking.id, 'cancelled')} variant="danger" icon={XCircleIcon} label="Cancel" />
          )}
          {(booking.status === 'completed' || booking.status === 'no-show') && (
            <ActionButton onClick={() => onStatusChange(booking.id, 'confirmed')} variant="neutral" icon={ArrowPathIcon} label="Reopen" />
          )}
          <button onClick={onView} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all" title="View details">
            <EyeIcon className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, variant, icon: Icon, label }: { onClick: () => void; variant: 'success' | 'danger' | 'neutral'; icon: any; label: string }) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300',
    danger: 'bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300',
    neutral: 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70',
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${styles[variant]}`}>
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}

function EmptyState({
  viewMode,
  date,
  hasSearch,
  hasFilter,
}: {
  viewMode: ViewMode;
  date: string;
  hasSearch: boolean;
  hasFilter: boolean;
}) {
  const title = viewMode === 'upcoming'
    ? 'No upcoming bookings'
    : `No bookings for ${relativeDayLabel(date).toLowerCase()}`;

  return (
    <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
          <CalendarDaysIcon className="h-12 w-12 text-cyan-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/40 text-sm max-w-sm mx-auto">
        {hasSearch
          ? 'Try a different search term, or clear the filter.'
          : hasFilter
          ? 'Try switching back to the "All" tab.'
          : viewMode === 'upcoming'
          ? 'New bookings from clients will appear here automatically.'
          : 'Nothing booked yet. Use the arrows above to check another day.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking details modal with OTP completion flow                    */
/* ------------------------------------------------------------------ */

function BookingDetailsModal({
  booking,
  onClose,
  onStatusChange,
  onRefresh,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, s: Booking['status']) => void;
  onRefresh: () => void;
}) {
  const meta = STATUS_META[booking.status];

  // OTP state
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const handleRequestCode = async () => {
    setRequestLoading(true);
    setOtpError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `/api/auth/bookings/salon/${booking.id}/request-completion`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not send code');
      }
      setOtpRequested(true);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(
        `/api/auth/bookings/salon/${booking.id}/verify-completion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp }),
          cache: 'no-store',
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Invalid code');
      }
      onRefresh();
      onClose();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="sticky top-0 backdrop-blur-2xl bg-slate-900/80 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate">Booking details</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {formatTime(booking.time)} · {booking.duration} min
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${meta.bg} ${meta.text} ${meta.border}`}>
            <meta.icon className="h-3.5 w-3.5" />{meta.label}
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-3">Client</h3>
            <div className="space-y-2">
              <InfoRow icon={UserIcon} value={booking.clientName} />
              <InfoRow icon={EnvelopeIcon} value={booking.clientEmail} />
              <InfoRow icon={PhoneIcon} value={booking.clientPhone} />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-3">Service</h3>
            <div className="space-y-2">
              <InfoRow icon={ScissorsIcon} value={booking.serviceName} />
              <InfoRow icon={CalendarIcon} value={formatLongDate(booking.date)} />
              <InfoRow icon={ClockIcon} value={`${formatTime(booking.time)} · ${booking.duration} min`} />
              <InfoRow icon={CurrencyPoundIcon} value={formatCurrency(booking.amount)} accent />
            </div>
          </div>

          {booking.notes && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-2">Notes</h3>
              <p className="text-white/70 text-sm leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {booking.referenceImages && booking.referenceImages.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-3 flex items-center gap-1.5">
                <PhotoIcon className="h-3.5 w-3.5" />
                Reference photos ({booking.referenceImages.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {booking.referenceImages.map((filename, i) => {
                  const url = resolveBookingImageUrl(booking.id, filename);
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/40 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Reference ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <EyeIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* OTP section — appears after the salon requests a code */}
          {otpRequested && (
            <div className="bg-cyan-500/5 border border-cyan-400/30 rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold mb-2 flex items-center gap-1.5">
                <KeyIcon className="h-3.5 w-3.5" />
                Enter completion code
              </h3>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                A 6-digit code was sent to <span className="text-white/80">{booking.clientEmail}</span>.
                Ask the customer for the code and enter it below.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setOtpError(null);
                  }}
                  placeholder="000000"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/50"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={otp.length !== 6 || otpLoading}
                  className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {otpLoading ? 'Verifying…' : 'Verify'}
                </button>
              </div>
              {otpError && (
                <p className="mt-2 text-xs text-red-400">{otpError}</p>
              )}
            </div>
          )}

          {/* Request-level error (only shown if code request failed and OTP section isn't visible) */}
          {!otpRequested && otpError && (
            <p className="text-xs text-red-400">{otpError}</p>
          )}
        </div>

        <div className="sticky bottom-0 backdrop-blur-2xl bg-slate-900/80 border-t border-white/[0.06] px-6 py-4 flex flex-wrap gap-2">
          <button onClick={onClose} className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all">
            Close
          </button>

          {booking.status === 'pending' && (
            <>
              <button onClick={() => { onStatusChange(booking.id, 'confirmed'); onClose(); }} className="flex-1 min-w-[120px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2.5 rounded-xl text-sm font-medium transition-all">
                Confirm booking
              </button>
              <button onClick={() => { onStatusChange(booking.id, 'cancelled'); onClose(); }} className="flex-1 min-w-[120px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 py-2.5 rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
            </>
          )}

          {booking.status === 'confirmed' && !otpRequested && (
            <>
              <button
                onClick={handleRequestCode}
                disabled={requestLoading}
                className="flex-1 min-w-[120px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2.5 rounded-xl text-sm font-medium transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyIcon className="h-4 w-4" />
                {requestLoading ? 'Sending code…' : 'Complete with code'}
              </button>
              <button onClick={() => { onStatusChange(booking.id, 'cancelled'); onClose(); }} className="flex-1 min-w-[120px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 py-2.5 rounded-xl text-sm font-medium transition-all">
                Cancel
              </button>
            </>
          )}

          {(booking.status === 'completed' || booking.status === 'no-show') && (
            <button onClick={() => { onStatusChange(booking.id, 'confirmed'); onClose(); }} className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-2.5 rounded-xl text-sm font-medium transition-all">
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, value, accent }: { icon: any; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 flex-shrink-0 ${accent ? 'text-cyan-400' : 'text-white/40'}`} />
      <span className={`text-sm truncate ${accent ? 'text-cyan-300 font-medium' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}