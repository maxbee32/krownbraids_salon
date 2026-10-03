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
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
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

const formatTime = (time: string) => {
  if (time.includes(':')) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  return time;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

const isToday = (isoDate: string) => isoDate === toISODate(new Date());

const relativeDayLabel = (isoDate: string) => {
  const today = toISODate(new Date());
  if (isoDate === today) return 'Today';
  if (isoDate === addDays(today, 1)) return 'Tomorrow';
  if (isoDate === addDays(today, -1)) return 'Yesterday';
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<
  Booking['status'],
  { label: string; text: string; bg: string; border: string; dot: string; icon: any }
> = {
  pending: {
    label: 'Pending',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    icon: ClockIcon,
  },
  confirmed: {
    label: 'Confirmed',
    text: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
    icon: CheckIconSolid,
  },
  completed: {
    label: 'Completed',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: 'Cancelled',
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    icon: XCircleIcon,
  },
  'no-show': {
    label: 'No-show',
    text: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/15',
    dot: 'bg-white/40',
    icon: NoSymbolIcon,
  },
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

  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));

  /* ---------- Fetch ---------- */
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * When the session is about to expire, close any open modal or transient
   * UI so the session expiry warning gets the user's full attention.
   */
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
      if (!token) {
        router.push('/login');
        return;
      }

      const salonResponse = await fetch('/api/auth/business/salons/onboarding', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!salonResponse.ok) throw new Error('Failed to fetch salon data');

      const salonData = await salonResponse.json();
      const salonId = salonData.salonId || salonData.id;
      if (!salonId) {
        router.push('/dashboard/setup');
        return;
      }

      // -------- Replace with real API call --------
      // const response = await fetch(`/api/auth/bookings?salonId=${salonId}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      const today = toISODate(new Date());
      const tomorrow = addDays(today, 1);
      const yesterday = addDays(today, -1);

      const mockBookings: Booking[] = [
        { id: '1', serviceId: '101', serviceName: 'African Braids', salonId: String(salonId), clientId: '201', clientName: 'Sarah Johnson', clientEmail: 'sarah@email.com', clientPhone: '+44 7700 900000', date: today, time: '09:00', duration: 120, amount: 85, status: 'confirmed', notes: 'Large box braids, mid-back length', createdAt: '', updatedAt: '' },
        { id: '2', serviceId: '102', serviceName: 'Hair Styling', salonId: String(salonId), clientId: '202', clientName: 'Maria Garcia', clientEmail: 'maria@email.com', clientPhone: '+44 7700 900001', date: today, time: '11:30', duration: 60, amount: 45, status: 'pending', notes: 'Bridesmaid styling', createdAt: '', updatedAt: '' },
        { id: '3', serviceId: '103', serviceName: 'Makeup Application', salonId: String(salonId), clientId: '203', clientName: 'Aisha Patel', clientEmail: 'aisha@email.com', clientPhone: '+44 7700 900002', date: today, time: '14:00', duration: 90, amount: 65, status: 'pending', notes: 'Engagement photos', createdAt: '', updatedAt: '' },
        { id: '4', serviceId: '104', serviceName: 'Nail Art', salonId: String(salonId), clientId: '205', clientName: 'Lisa Chen', clientEmail: 'lisa@email.com', clientPhone: '+44 7700 900004', date: today, time: '16:00', duration: 45, amount: 35, status: 'completed', notes: '', createdAt: '', updatedAt: '' },
        { id: '5', serviceId: '103', serviceName: 'Makeup Application', salonId: String(salonId), clientId: '207', clientName: 'Chloe Mitchell', clientEmail: 'chloe@email.com', clientPhone: '+44 7700 900006', date: today, time: '17:30', duration: 90, amount: 65, status: 'no-show', notes: 'Client did not attend', createdAt: '', updatedAt: '' },
        { id: '6', serviceId: '105', serviceName: 'Facial Treatment', salonId: String(salonId), clientId: '208', clientName: 'Emma Thompson', clientEmail: 'emma@email.com', clientPhone: '+44 7700 900007', date: tomorrow, time: '10:00', duration: 60, amount: 55, status: 'pending', notes: 'First-time client', createdAt: '', updatedAt: '' },
        { id: '7', serviceId: '102', serviceName: 'Hair Styling', salonId: String(salonId), clientId: '206', clientName: 'Tunde Okonkwo', clientEmail: 'tunde@email.com', clientPhone: '+44 7700 900005', date: tomorrow, time: '14:00', duration: 60, amount: 45, status: 'confirmed', notes: '', createdAt: '', updatedAt: '' },
        { id: '8', serviceId: '101', serviceName: 'African Braids', salonId: String(salonId), clientId: '204', clientName: 'Jessica Williams', clientEmail: 'jessica@email.com', clientPhone: '+44 7700 900003', date: yesterday, time: '11:00', duration: 120, amount: 85, status: 'completed', notes: '', createdAt: '', updatedAt: '' },
      ];

      setBookings(mockBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Derived ---------- */
  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, selectedDate]
  );

  const stats = useMemo(
    () => ({
      total: dayBookings.length,
      pending: dayBookings.filter((b) => b.status === 'pending').length,
      confirmed: dayBookings.filter((b) => b.status === 'confirmed').length,
      completed: dayBookings.filter((b) => b.status === 'completed').length,
      cancelled: dayBookings.filter((b) => b.status === 'cancelled').length,
      noShow: dayBookings.filter((b) => b.status === 'no-show').length,
      revenue: dayBookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + b.amount, 0),
    }),
    [dayBookings]
  );

  const filteredBookings = useMemo(() => {
    let result = [...dayBookings];
    if (activeTab !== 'all') result = result.filter((b) => b.status === activeTab);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.clientName.toLowerCase().includes(term) ||
          b.serviceName.toLowerCase().includes(term) ||
          b.clientEmail.toLowerCase().includes(term) ||
          b.clientPhone.includes(term)
      );
    }
    return result;
  }, [dayBookings, activeTab, searchTerm]);

  /* ---------- Actions ---------- */
  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // await fetch(`/api/auth/bookings/${bookingId}/status`, {
      //   method: 'PATCH',
      //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus }),
      // });

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

  /* ---------- Loading ---------- */
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

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Bookings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            View and manage your appointment diary, day by day.
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

      {/* Success */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ============ Date navigator ============ */}
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
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                aria-label="Previous day"
              >
                <ChevronLeftIcon className="h-4 w-4 text-white/70" />
              </button>
              <button
                onClick={() => setSelectedDate(toISODate(new Date()))}
                disabled={isToday(selectedDate)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isToday(selectedDate)
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                aria-label="Next day"
              >
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

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          label={isToday(selectedDate) ? "Today's bookings" : 'Total on this day'}
          value={stats.total.toString()}
          icon={CalendarIcon}
          color="text-cyan-400"
        />
        <StatCard
          label="Pending approval"
          value={stats.pending.toString()}
          icon={ClockIcon}
          color="text-amber-400"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed.toString()}
          icon={CheckIconSolid}
          color="text-cyan-400"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={BanknotesIcon}
          color="text-emerald-400"
        />
      </div>

      {/* ============ Search + tabs ============ */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search this day by client, service, email, or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
      </div>

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
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/30 text-cyan-200'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============ Booking list ============ */}
      {filteredBookings.length === 0 ? (
        <EmptyState
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
              onView={() => setSelectedBooking(booking)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* ============ Details modal ============ */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
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
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking row                                                        */
/* ------------------------------------------------------------------ */

function BookingRow({
  booking,
  onView,
  onStatusChange,
}: {
  booking: Booking;
  onView: () => void;
  onStatusChange: (id: string, status: Booking['status']) => void;
}) {
  const meta = STATUS_META[booking.status];
  const StatusIcon = meta.icon;

  return (
    <div className="group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/20 transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-1 lg:w-20 flex-shrink-0">
          <div className="text-lg font-semibold text-cyan-300 font-mono">
            {formatTime(booking.time)}
          </div>
          <div className="text-[11px] text-white/40">{booking.duration} min</div>
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
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>
              <p className="text-white/60 text-sm truncate mt-0.5">{booking.serviceName}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/40 mt-1.5">
                <span className="flex items-center gap-1">
                  <EnvelopeIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">{booking.clientEmail}</span>
                  <span className="sm:hidden">Email</span>
                </span>
                <span className="flex items-center gap-1">
                  <PhoneIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">{booking.clientPhone}</span>
                  <span className="sm:hidden">Phone</span>
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <CurrencyPoundIcon className="h-3 w-3" />
                  {formatCurrency(booking.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === 'pending' && (
            <>
              <ActionButton
                onClick={() => onStatusChange(booking.id, 'confirmed')}
                variant="success"
                icon={CheckIcon}
                label="Confirm"
              />
              <ActionButton
                onClick={() => onStatusChange(booking.id, 'cancelled')}
                variant="danger"
                icon={XCircleIcon}
                label="Cancel"
              />
            </>
          )}

          {booking.status === 'confirmed' && (
            <>
              <ActionButton
                onClick={() => onStatusChange(booking.id, 'completed')}
                variant="success"
                icon={CheckCircleIcon}
                label="Complete"
              />
              <ActionButton
                onClick={() => onStatusChange(booking.id, 'cancelled')}
                variant="danger"
                icon={XCircleIcon}
                label="Cancel"
              />
            </>
          )}

          {(booking.status === 'completed' || booking.status === 'no-show') && (
            <ActionButton
              onClick={() => onStatusChange(booking.id, 'confirmed')}
              variant="neutral"
              icon={ArrowPathIcon}
              label="Reopen"
            />
          )}

          <button
            onClick={onView}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title="View details"
          >
            <EyeIcon className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Action button                                                      */
/* ------------------------------------------------------------------ */

function ActionButton({
  onClick,
  variant,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  variant: 'success' | 'danger' | 'neutral';
  icon: any;
  label: string;
}) {
  const styles: Record<string, string> = {
    success:
      'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300',
    danger: 'bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300',
    neutral: 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70',
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${styles[variant]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({
  date,
  hasSearch,
  hasFilter,
}: {
  date: string;
  hasSearch: boolean;
  hasFilter: boolean;
}) {
  return (
    <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
          <CalendarDaysIcon className="h-12 w-12 text-cyan-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No bookings for {relativeDayLabel(date).toLowerCase()}
      </h3>
      <p className="text-white/40 text-sm max-w-sm mx-auto">
        {hasSearch
          ? 'Try a different search term, or clear the filter.'
          : hasFilter
          ? 'Try switching back to the "All" tab, or pick another day.'
          : 'Nothing booked yet. Use the arrows above to check another day.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Details modal                                                      */
/* ------------------------------------------------------------------ */

function BookingDetailsModal({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: Booking['status']) => void;
}) {
  const meta = STATUS_META[booking.status];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="sticky top-0 backdrop-blur-2xl bg-slate-900/80 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate">
              Booking details
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {formatTime(booking.time)} · {booking.duration} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${meta.bg} ${meta.text} ${meta.border}`}
          >
            <meta.icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-3">
              Client
            </h3>
            <div className="space-y-2">
              <InfoRow icon={UserIcon} value={booking.clientName} />
              <InfoRow icon={EnvelopeIcon} value={booking.clientEmail} />
              <InfoRow icon={PhoneIcon} value={booking.clientPhone} />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-3">
              Service
            </h3>
            <div className="space-y-2">
              <InfoRow icon={ScissorsIcon} value={booking.serviceName} />
              <InfoRow icon={CalendarIcon} value={formatLongDate(booking.date)} />
              <InfoRow icon={ClockIcon} value={`${formatTime(booking.time)} · ${booking.duration} min`} />
              <InfoRow
                icon={CurrencyPoundIcon}
                value={formatCurrency(booking.amount)}
                accent
              />
            </div>
          </div>

          {booking.notes && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-2">
                Notes
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 backdrop-blur-2xl bg-slate-900/80 border-t border-white/[0.06] px-6 py-4 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            Close
          </button>

          {booking.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'confirmed');
                  onClose();
                }}
                className="flex-1 min-w-[120px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                Confirm booking
              </button>
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'cancelled');
                  onClose();
                }}
                className="flex-1 min-w-[120px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <button
              onClick={() => {
                onStatusChange(booking.id, 'completed');
                onClose();
              }}
              className="flex-1 min-w-[120px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              Mark as completed
            </button>
          )}

          {(booking.status === 'completed' || booking.status === 'no-show') && (
            <button
              onClick={() => {
                onStatusChange(booking.id, 'confirmed');
                onClose();
              }}
              className="flex-1 min-w-[120px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  value,
  accent,
}: {
  icon: any;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 flex-shrink-0 ${accent ? 'text-cyan-400' : 'text-white/40'}`} />
      <span className={`text-sm truncate ${accent ? 'text-cyan-300 font-medium' : 'text-white/80'}`}>
        {value}
      </span>
    </div>
  );
}