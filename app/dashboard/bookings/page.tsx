// app/dashboard/bookings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
  CurrencyPoundIcon,
  ScissorsIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  NoSymbolIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";

// Types
interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  today: number;
  upcoming: number;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    today: 0,
    upcoming: 0
  });

  // Fetch bookings
  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings when tab or search changes
  useEffect(() => {
    let result = [...bookings];

    // Filter by tab
    if (activeTab !== 'all') {
      result = result.filter(b => b.status === activeTab);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.clientName.toLowerCase().includes(term) ||
        b.serviceName.toLowerCase().includes(term) ||
        b.clientEmail.toLowerCase().includes(term) ||
        b.clientPhone.includes(term)
      );
    }

    setFilteredBookings(result);
  }, [bookings, activeTab, searchTerm]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/');
        return;
      }

      // Get salon ID
      const salonResponse = await fetch('/api/auth/business/salons/onboarding', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!salonResponse.ok) {
        throw new Error('Failed to fetch salon data');
      }

      const salonData = await salonResponse.json();
      const salonId = salonData.salonId || salonData.id;

      if (!salonId) {
        router.push('/dashboard/setup');
        return;
      }

      // Fetch bookings (using mock data for now - replace with actual API)
      // const response = await fetch(`/api/auth/bookings?salonId=${salonId}`, {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });

      // For demo, use mock data
      const mockBookings: Booking[] = [
        {
          id: '1',
          serviceId: '101',
          serviceName: 'African Braids',
          salonId: salonId.toString(),
          clientId: '201',
          clientName: 'Sarah Johnson',
          clientEmail: 'sarah@email.com',
          clientPhone: '+44 7700 900000',
          date: '2026-09-10',
          time: '10:00',
          duration: 120,
          amount: 85.00,
          status: 'confirmed',
          notes: 'She wants large box braids, mid-back length',
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-01T10:00:00Z'
        },
        {
          id: '2',
          serviceId: '102',
          serviceName: 'Hair Styling',
          salonId: salonId.toString(),
          clientId: '202',
          clientName: 'Maria Garcia',
          clientEmail: 'maria@email.com',
          clientPhone: '+44 7700 900001',
          date: '2026-09-10',
          time: '13:00',
          duration: 60,
          amount: 45.00,
          status: 'pending',
          notes: 'Wedding hair styling for bridesmaid',
          createdAt: '2026-09-02T14:00:00Z',
          updatedAt: '2026-09-02T14:00:00Z'
        },
        {
          id: '3',
          serviceId: '103',
          serviceName: 'Makeup Application',
          salonId: salonId.toString(),
          clientId: '203',
          clientName: 'Aisha Patel',
          clientEmail: 'aisha@email.com',
          clientPhone: '+44 7700 900002',
          date: '2026-09-11',
          time: '09:00',
          duration: 90,
          amount: 65.00,
          status: 'pending',
          notes: 'Bridal makeup for engagement photos',
          createdAt: '2026-09-03T09:00:00Z',
          updatedAt: '2026-09-03T09:00:00Z'
        },
        {
          id: '4',
          serviceId: '101',
          serviceName: 'African Braids',
          salonId: salonId.toString(),
          clientId: '204',
          clientName: 'Jessica Williams',
          clientEmail: 'jessica@email.com',
          clientPhone: '+44 7700 900003',
          date: '2026-09-05',
          time: '11:00',
          duration: 120,
          amount: 85.00,
          status: 'completed',
          notes: 'Knotless braids, waist length',
          createdAt: '2026-08-28T11:00:00Z',
          updatedAt: '2026-09-05T13:00:00Z'
        },
        {
          id: '5',
          serviceId: '104',
          serviceName: 'Nail Art',
          salonId: salonId.toString(),
          clientId: '205',
          clientName: 'Lisa Chen',
          clientEmail: 'lisa@email.com',
          clientPhone: '+44 7700 900004',
          date: '2026-09-08',
          time: '15:00',
          duration: 45,
          amount: 35.00,
          status: 'cancelled',
          notes: 'Cancelled due to emergency',
          createdAt: '2026-09-01T15:00:00Z',
          updatedAt: '2026-09-07T10:00:00Z'
        },
        {
          id: '6',
          serviceId: '102',
          serviceName: 'Hair Styling',
          salonId: salonId.toString(),
          clientId: '206',
          clientName: 'Tunde Okonkwo',
          clientEmail: 'tunde@email.com',
          clientPhone: '+44 7700 900005',
          date: '2026-09-12',
          time: '14:00',
          duration: 60,
          amount: 45.00,
          status: 'confirmed',
          notes: 'Interview prep - professional style',
          createdAt: '2026-09-04T16:00:00Z',
          updatedAt: '2026-09-04T16:00:00Z'
        },
        {
          id: '7',
          serviceId: '103',
          serviceName: 'Makeup Application',
          salonId: salonId.toString(),
          clientId: '207',
          clientName: 'Chloe Mitchell',
          clientEmail: 'chloe@email.com',
          clientPhone: '+44 7700 900006',
          date: '2026-09-09',
          time: '10:30',
          duration: 90,
          amount: 65.00,
          status: 'no-show',
          notes: 'Client did not show up',
          createdAt: '2026-09-02T10:30:00Z',
          updatedAt: '2026-09-09T12:00:00Z'
        },
        {
          id: '8',
          serviceId: '105',
          serviceName: 'Facial Treatment',
          salonId: salonId.toString(),
          clientId: '208',
          clientName: 'Emma Thompson',
          clientEmail: 'emma@email.com',
          clientPhone: '+44 7700 900007',
          date: '2026-09-10',
          time: '16:00',
          duration: 60,
          amount: 55.00,
          status: 'pending',
          notes: 'First time client - glowing skin package',
          createdAt: '2026-09-06T18:00:00Z',
          updatedAt: '2026-09-06T18:00:00Z'
        }
      ];

      setBookings(mockBookings);

      // Calculate stats
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      setStats({
        total: mockBookings.length,
        pending: mockBookings.filter(b => b.status === 'pending').length,
        confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
        completed: mockBookings.filter(b => b.status === 'completed').length,
        cancelled: mockBookings.filter(b => b.status === 'cancelled').length,
        noShow: mockBookings.filter(b => b.status === 'no-show').length,
        today: mockBookings.filter(b => b.date === today).length,
        upcoming: mockBookings.filter(b => b.date >= today && b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'no-show').length
      });

    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch(`/api/auth/bookings/${bookingId}/status`, {
      //   method: 'PATCH',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ status: newStatus }),
      // });

      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      // Update stats
      setStats(prev => {
        // Find old status
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return prev;

        const statusKeys: Record<Booking['status'], keyof BookingStats> = {
          'pending': 'pending',
          'confirmed': 'confirmed',
          'completed': 'completed',
          'cancelled': 'cancelled',
          'no-show': 'noShow'
        };

        const oldKey = statusKeys[booking.status];
        const newKey = statusKeys[newStatus];

        return {
          ...prev,
          [oldKey]: Math.max(0, (prev[oldKey] || 0) - 1),
          [newKey]: (prev[newKey] || 0) + 1
        };
      });

      setSuccessMessage(`Booking ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'confirmed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'completed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
      'no-show': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || 'bg-white/10 text-white/30 border-white/10';
  };

  const getStatusIcon = (status: Booking['status']) => {
    const icons = {
      'pending': ClockIconSolid,
      'confirmed': CheckIconSolid,
      'completed': CheckCircleIcon,
      'cancelled': XCircleIcon,
      'no-show': NoSymbolIcon
    };
    return icons[status] || ClockIconSolid;
  };

  const getStatusLabel = (status: Booking['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const tabs = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { id: 'no-show', label: 'No Show', count: stats.noShow }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4 text-sm">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen px-4 py-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl hover:bg-white/10 transition-all flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white/60" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Bookings</h1>
                <p className="text-white/40 text-sm">Manage your appointments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchBookings()}
                className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 border border-white/10"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 animate-fade-in">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400/60 hover:text-red-400 flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold">{stats.today}</p>
              <p className="text-white/40 text-xs">Today's Bookings</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold">{stats.upcoming}</p>
              <p className="text-white/40 text-xs">Upcoming</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-white/40 text-xs">Pending</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-white/40 text-xs">Completed</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by client, service, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-white/60" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-purple-500/10">
                  <CalendarDaysIcon className="h-12 w-12 text-purple-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No bookings found</h3>
              <p className="text-white/40 text-sm max-w-sm mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search or filters'
                  : 'Your bookings will appear here once clients start booking'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const StatusIcon = getStatusIcon(booking.status);
                const statusColor = getStatusColor(booking.status);
                
                return (
                  <div
                    key={booking.id}
                    className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left - Client & Service Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-white truncate">
                                {booking.clientName}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}>
                                <StatusIcon className="h-3 w-3" />
                                {getStatusLabel(booking.status)}
                              </span>
                            </div>
                            <p className="text-white/60 text-sm truncate">
                              {booking.serviceName}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/40 mt-1">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(booking.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {formatTime(booking.time)} ({booking.duration} min)
                              </span>
                              <span className="flex items-center gap-1">
                                <CurrencyPoundIcon className="h-3 w-3" />
                                {formatCurrency(booking.amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right - Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Client Contact */}
                        <div className="flex items-center gap-1 text-white/40 text-xs">
                          <EnvelopeIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{booking.clientEmail}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/40 text-xs">
                          <PhoneIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{booking.clientPhone}</span>
                        </div>

                        {/* Status Actions */}
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                              title="Confirm"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                              title="Cancel"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'completed')}
                              className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                              title="Mark Complete"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                              title="Cancel"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {booking.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                            title="Reopen"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}

                        {booking.status === 'no-show' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                            title="Reopen"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4 text-white/40" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
              >
                <XMarkIcon className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/60 mb-2">Client Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <UserIcon className="h-4 w-4 text-white/40" />
                    <span>{selectedBooking.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <EnvelopeIcon className="h-4 w-4 text-white/40" />
                    <span>{selectedBooking.clientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <PhoneIcon className="h-4 w-4 text-white/40" />
                    <span>{selectedBooking.clientPhone}</span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/60 mb-2">Service Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <ScissorsIcon className="h-4 w-4 text-white/40" />
                    <span>{selectedBooking.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CalendarIcon className="h-4 w-4 text-white/40" />
                    <span>{formatDate(selectedBooking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <ClockIcon className="h-4 w-4 text-white/40" />
                    <span>{formatTime(selectedBooking.time)} ({selectedBooking.duration} min)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CurrencyPoundIcon className="h-4 w-4 text-white/40" />
                    <span>{formatCurrency(selectedBooking.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white/60 mb-2">Notes</h3>
                  <p className="text-white/80 text-sm">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 bg-white/10 py-2.5 rounded-xl text-white/60 text-sm hover:bg-white/20 transition-all"
                >
                  Close
                </button>
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedBooking.id, 'confirmed');
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2.5 rounded-xl text-sm transition-all"
                    >
                      Confirm Booking
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, 'completed');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2.5 rounded-xl text-sm transition-all"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @media (min-width: 640px) {
          .animate-slide-up {
            animation: fade-in 0.3s ease-out;
          }
        }
      `}</style>
    </div>
  );
}