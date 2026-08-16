// app/dashboard/page.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ScissorsIcon,
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salonStatus, setSalonStatus] = useState<'no_salon' | 'pending' | 'approved' | 'rejected' | 'active'>('no_salon');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Play video
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay prevented:", error);
      });
    }
  }, []);

  const checkSalonStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/salon/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.hasSalon) {
          router.push('/dashboard/setup');
          return;
        }

        switch (data.salonStatus) {
          case 'PENDING':
            setSalonStatus('pending');
            break;
          case 'APPROVED':
            setSalonStatus('approved');
            break;
          case 'REJECTED':
            setSalonStatus('rejected');
            break;
          case 'ACTIVE':
            setSalonStatus('active');
            break;
          default:
            setSalonStatus('no_salon');
        }
      } else if (response.status === 404) {
        router.push('/dashboard/setup');
        return;
      } else {
        console.error('Failed to check salon status');
      }
    } catch (error) {
      console.error('Error checking salon status:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSalonStatus();
  }, [checkSalonStatus]);

  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-950">
        <div className="absolute inset-0 w-full h-full">
          <video
            ref={videoRef}
            src="/assets/styke-12.webp"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto"></div>
          <p className="text-white/50 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (salonStatus === 'pending') {
    return <PendingApprovalPage />;
  }

  if (salonStatus === 'rejected') {
    return <RejectedPage />;
  }

  return <ActiveDashboard />;
}

// Pending Approval Page
function PendingApprovalPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay prevented:", error);
      });
    }
  }, []);
  
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          src="/assets/346700.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
          <div className="flex justify-center mb-4">
            <ScissorsIcon className="h-12 w-12 text-cyan-400" />
          </div>
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">Salon Under Review</h2>
          <p className="text-white/50 text-sm mb-6">
            Your salon registration is being reviewed by our admin team.
            You&apos;ll receive an email notification once approved.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
            <p className="text-yellow-300/80 text-sm">
              <span className="font-medium">Status:</span> Pending Approval
            </p>
            <p className="text-yellow-300/50 text-xs mt-1">
              This usually takes 24-48 hours
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/20 py-2.5 rounded-xl text-white font-medium hover:bg-white/30 transition-all"
            >
              Check Status
            </button>
            <button
              onClick={() => router.push('/dashboard/support')}
              className="w-full bg-white/5 py-2.5 rounded-xl text-white/60 hover:text-white transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rejected Page
function RejectedPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay prevented:", error);
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          src="/assets/346700.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
          <div className="flex justify-center mb-4">
            <ScissorsIcon className="h-12 w-12 text-cyan-400" />
          </div>
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-2">Salon Registration Rejected</h2>
          <p className="text-white/50 text-sm mb-6">
            Your salon registration was not approved. Please contact support for more information.
          </p>
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-6">
            <p className="text-red-300/80 text-sm">
              <span className="font-medium">Reason:</span> Please contact support
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard/support')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Contact Support
            </button>
            <button
              onClick={() => router.push('/dashboard/setup')}
              className="w-full bg-white/10 py-2.5 rounded-xl text-white/60 hover:text-white transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Active Dashboard Component
function ActiveDashboard() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    revenue: 0,
    customers: 0,
    services: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay prevented:", error);
      });
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      const activityResponse = await fetch('/api/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/');
  };

  const navItems = [
    { name: "Dashboard", icon: HomeIcon, href: "/dashboard", current: true },
    { name: "Bookings", icon: CalendarIcon, href: "/dashboard/bookings", current: false },
    { name: "Customers", icon: UserGroupIcon, href: "/dashboard/customers", current: false },
    { name: "Settings", icon: Cog6ToothIcon, href: "/dashboard/settings", current: false },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          src="/assets/346700.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top Navigation */}
        <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ScissorsIcon className="h-7 w-7 text-cyan-400" />
              <span className="text-white font-bold text-lg hidden sm:block">KROWNBRAIDS</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/setup')}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white/80 hover:text-white text-sm transition-all flex items-center gap-1.5"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Salon</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1.5"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Dashboard</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                title="Total Bookings"
                value={loading ? '...' : stats.totalBookings}
                icon="📅"
                color="purple"
              />
              <StatCard
                title="Revenue"
                value={loading ? '...' : `£${stats.revenue}`}
                icon="💰"
                color="green"
              />
              <StatCard
                title="Customers"
                value={loading ? '...' : stats.customers}
                icon="👤"
                color="blue"
              />
              <StatCard
                title="Services"
                value={loading ? '...' : stats.services}
                icon="✂️"
                color="pink"
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <QuickAction
                href="/dashboard/bookings/new"
                icon="📝"
                label="New Booking"
              />
              <QuickAction
                href="/dashboard/bookings"
                icon="📋"
                label="All Bookings"
              />
              <QuickAction
                href="/dashboard/customers"
                icon="👥"
                label="Customers"
              />
              <QuickAction
                href="/dashboard/services"
                icon="✂️"
                label="Services"
              />
            </div>

            {/* Recent Activity */}
            <div className="mt-6 sm:mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6">
              <h3 className="text-white font-medium mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500"></div>
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <ActivityItem
                      key={index}
                      message={activity.message}
                      time={activity.time}
                      type={activity.type || 'info'}
                    />
                  ))
                ) : (
                  <ActivityItem
                    message="No recent activity"
                    time=""
                    type="info"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 text-center py-3 border-t border-white/5 bg-white/5 backdrop-blur-sm">
          <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
            © 2026 KROWNBRAIDS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color: string;
}) {
  const colors = {
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    pink: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/40 text-xs sm:text-sm">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`text-xl sm:text-2xl p-2 sm:p-3 rounded-xl ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(href)}
      className="bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 p-4 sm:p-6 text-center transition-all hover:scale-105"
    >
      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
      <span className="text-white/70 text-xs sm:text-sm">{label}</span>
    </button>
  );
}

// Activity Item Component
function ActivityItem({ message, time, type }: { message: string; time: string; type: 'success' | 'info' | 'warning' }) {
  const colors = {
    success: 'bg-green-500/20 text-green-400',
    info: 'bg-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 text-sm">
      <div className={`w-2 h-2 rounded-full ${colors[type]}`}></div>
      <span className="text-white/60 flex-1 text-xs sm:text-sm">{message}</span>
      {time && <span className="text-white/30 text-xs">{time}</span>}
    </div>
  );
}