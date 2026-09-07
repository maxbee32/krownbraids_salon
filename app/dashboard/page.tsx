// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useServiceContext } from '@/app/context/ServiceContext';

import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CogIcon,
  ScissorsIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  GiftIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";

interface SalonData {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  website: string;
  facebook: string;
  instagram: string;
  twitter: string;
  status: string;
  onboardingStep: string;
  onboardingCompleted: boolean;
  selectedPlanId: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to format status for display
const formatStatus = (status: string): { label: string; color: string; bg: string; icon: any } => {
  const statusMap: { [key: string]: { label: string; color: string; bg: string; icon: any } } = {
    'PENDING_APPROVAL': {
      label: 'Pending Approval',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      icon: ClockIcon
    },
    'PENDING': {
      label: 'Pending Approval',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      icon: ClockIcon
    },
    'APPROVED': {
      label: 'Approved',
      color: 'text-green-400',
      bg: 'bg-green-500/20 border-green-500/30',
      icon: CheckCircleIcon
    },
    'ACTIVE': {
      label: 'Active',
      color: 'text-green-400',
      bg: 'bg-green-500/20 border-green-500/30',
      icon: CheckCircleIcon
    },
    'REJECTED': {
      label: 'Rejected',
      color: 'text-red-400',
      bg: 'bg-red-500/20 border-red-500/30',
      icon: XCircleIcon
    },
    'DECLINED': {
      label: 'Declined',
      color: 'text-red-400',
      bg: 'bg-red-500/20 border-red-500/30',
      icon: XCircleIcon
    },
    'REVIEW': {
      label: 'Under Review',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      icon: ClockIcon
    },
    'COMPLETED': {
      label: 'Complete',
      color: 'text-green-400',
      bg: 'bg-green-500/20 border-green-500/30',
      icon: CheckCircleIcon
    }
  };

  return statusMap[status] || {
    label: status?.replace(/_/g, ' ') || 'Unknown',
    color: 'text-gray-400',
    bg: 'bg-white/10 border-white/10',
    icon: ClockIcon
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSalonStatus = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/');
          return;
        }

        const onboardingResponse = await fetch('/api/auth/business/salons/onboarding', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!onboardingResponse.ok) {
          if (onboardingResponse.status === 404) {
            console.log('No salon found, redirecting to setup');
            router.push('/dashboard/setup');
            return;
          }
          setError('Failed to load salon data');
          setLoading(false);
          return;
        }

        const onboardingData = await onboardingResponse.json();
        const salonId = onboardingData.salonId || onboardingData.id;
        
        if (!salonId) {
          router.push('/dashboard/setup');
          return;
        }

        const salonResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (salonResponse.ok) {
          const salonData = await salonResponse.json();
          const fullSalonData = salonData.data || salonData;
          
          if (fullSalonData && fullSalonData.id) {
            setSalon(fullSalonData);
          } else {
            setError('No salon data found');
          }
        } else {
          setSalon({
            id: salonId,
            name: 'Your Salon',
            description: '',
            address: '',
            city: '',
            state: '',
            country: 'United Kingdom',
            postalCode: '',
            email: '',
            phoneNumber: '',
            website: '',
            facebook: '',
            instagram: '',
            twitter: '',
            status: onboardingData.step || 'PENDING_APPROVAL',
            onboardingStep: onboardingData.step || 'REVIEW',
            onboardingCompleted: onboardingData.completed || false,
            selectedPlanId: onboardingData.selectedPlanId || 0,
            ownerId: onboardingData.ownerId || 0,
            createdAt: '',
            updatedAt: ''
          });
        }
      } catch (error) {
        console.error('Error checking salon status:', error);
        setError('An error occurred while loading your data');
      } finally {
        setLoading(false);
      }
    };

    checkSalonStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-purple-300/30 animate-pulse" />
          </div>
          <p className="text-white/40 mt-4 text-sm font-medium">Loading your dashboard...</p>
          <p className="text-white/20 text-xs mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4">Loading salon data...</p>
        </div>
      </div>
    );
  }

  const salonStatus = salon.status || salon.onboardingStep || 'PENDING_APPROVAL';
  const formattedStatus = formatStatus(salonStatus);

  if (salonStatus === 'PENDING_APPROVAL' || salonStatus === 'PENDING' || salonStatus === 'REVIEW') {
    return <PendingApprovalPage salon={salon} router={router} />;
  }

  if (salonStatus === 'APPROVED' || salonStatus === 'ACTIVE') {
    return <ApprovedDashboard salon={salon} router={router} />;
  }

  if (salonStatus === 'REJECTED' || salonStatus === 'DECLINED') {
    return <RejectedPage salon={salon} router={router} />;
  }

  return <PendingApprovalPage salon={salon} router={router} />;
}

// Pending Approval Page Component
function PendingApprovalPage({ salon, router }: { salon: SalonData | null; router: any }) {
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Pending Approval', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: ClockIcon };
  const salonName = salon?.name || 'Your Salon';
  const salonAddress = salon?.address || '';
  const salonCity = salon?.city || '';
  const salonId = salon?.id || 'N/A';

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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl">
          {/* Salon Info Card */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-4 md:p-6 border border-white/10 mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-2.5 md:p-3 rounded-xl flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold truncate">{salonName}</h2>
                <p className="text-white/40 text-xs md:text-sm truncate">
                  {salonAddress && salonCity ? `${salonAddress}, ${salonCity}` : 'Address not provided'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-white/20 text-[10px] md:text-xs">ID: {salonId}</p>
                  <span className={`text-[10px] md:text-xs flex items-center gap-1 ${statusDisplay.color}`}>
                    <statusDisplay.icon className="h-3 w-3" />
                    {statusDisplay.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approval Card */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                  <ClockIcon className="h-10 w-10 md:h-12 md:w-12 text-yellow-400" />
                </div>
                <div className="absolute -top-1 -right-1 animate-bounce">
                  <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <span className="text-[10px] md:text-xs font-bold text-black">!</span>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-2">Account Pending Approval</h1>
            <p className="text-white/60 text-base md:text-lg mb-2">
              Your salon <span className="text-white font-semibold">"{salonName}"</span> is being reviewed
            </p>
            <p className="text-white/40 text-xs md:text-sm mb-6 max-w-md mx-auto">
              Our admin team is verifying your business details and payment information.
            </p>

            {/* Status Timeline */}
            <div className="bg-white/5 rounded-xl p-4 md:p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Registration Complete</p>
                  <p className="text-xs text-white/40">Business and payment details submitted</p>
                </div>
              </div>
              <div className="border-l-2 border-yellow-400/30 ml-2.5 pl-6 mt-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <div className="h-5 w-5 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                      <ClockIcon className="h-3.5 w-3.5 text-yellow-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Admin Review</p>
                    <p className="text-xs text-white/40">Our team is reviewing your application</p>
                    <p className="text-xs text-white/30 mt-1">⏱️ Estimated: 24-48 hours</p>
                  </div>
                </div>
              </div>
              <div className="border-l-2 border-white/10 ml-2.5 pl-6 mt-3">
                <div className="flex items-start gap-3 opacity-50">
                  <div className="mt-1 flex-shrink-0">
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                      <ScissorsIcon className="h-3.5 w-3.5 text-white/30" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/50">Add Services & Go Live</p>
                    <p className="text-xs text-white/30">Once approved, you can add your services</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-yellow-500/5 border border-yellow-400/20 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-medium text-yellow-300 text-sm mb-2 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                What happens next?
              </h3>
              <ul className="text-yellow-300/60 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Admin team will verify your business details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  You'll receive an email notification once approved
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Start adding your services after approval
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  Your salon will be live and ready for bookings
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/dashboard/setup')}
                className="bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <ArrowRightIcon className="h-4 w-4" />
                View Setup
              </button>
              <button
                onClick={() => router.push('/dashboard/support')}
                className="bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Support
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                router.push('/');
              }}
              className="mt-4 text-white/20 text-xs hover:text-white/40 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Approved Dashboard Component
function ApprovedDashboard({ salon, router }: { salon: SalonData | null; router: any }) {
  const { serviceCount, refreshServiceCount } = useServiceContext();
  const salonName = salon?.name || 'Salon';
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: CheckCircleIcon };
  
  // ✅ Use state for stats with dynamic service count
  const [stats, setStats] = useState([
    { label: "Today's Bookings", value: "0", icon: CalendarIcon, color: "text-blue-400" },
    { label: "Total Clients", value: "0", icon: UserGroupIcon, color: "text-green-400" },
    { label: "Monthly Revenue", value: "£0", icon: ChartBarIcon, color: "text-purple-400" },
    { label: "Services", value: "0", icon: ScissorsIcon, color: "text-yellow-400" }
  ]);

  // ✅ Refresh service count on mount
  useEffect(() => {
    refreshServiceCount();
  }, []);

  // ✅ Update stats when serviceCount changes
  useEffect(() => {
    setStats(prev => prev.map(stat => 
      stat.label === "Services" 
        ? { ...stat, value: serviceCount.toString() } 
        : stat
    ));
  }, [serviceCount]);

  const quickActions = [
    { 
      title: "Services", 
      description: "Add and manage your salon services",
      icon: ScissorsIcon,
      color: "from-purple-500/20 to-purple-600/20",
      iconColor: "text-purple-400",
      path: "/dashboard/services",
      buttonText: "Manage Services"
    },
    { 
      title: "Bookings", 
      description: "View and manage your appointments",
      icon: CalendarIcon,
      color: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-400",
      path: "/dashboard/bookings",
      buttonText: "View Bookings"
    },
    { 
      title: "Settings", 
      description: "Update your salon profile and settings",
      icon: CogIcon,
      color: "from-gray-500/20 to-gray-600/20",
      iconColor: "text-gray-400",
      path: "/dashboard/settings",
      buttonText: "Go to Settings"
    }
  ];

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

      <div className="relative z-10 min-h-screen p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
                Welcome back, <span className="text-white font-medium">{salonName}</span>
                <span className="hidden sm:inline">🎉</span>
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className={`${statusDisplay.bg} ${statusDisplay.color} text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 whitespace-nowrap`}>
                <statusDisplay.icon className="h-3.5 w-3.5" />
                {statusDisplay.label}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  router.push('/');
                }}
                className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition-all border border-white/10"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Quick Start Banner */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 md:p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  Ready to Go Live!
                </h2>
                <p className="text-white/60 text-sm">
                  Your salon is approved! Start adding your services to attract clients.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/services')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <ScissorsIcon className="h-4 w-4" />
                Add Services
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-2xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5`}>
                    <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                    <p className="text-white/40 text-[10px] md:text-xs">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br ${action.color} backdrop-blur-2xl rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl bg-white/5`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                </div>
                <p className="text-white/40 text-sm mb-4">{action.description}</p>
                <button
                  onClick={() => router.push(action.path)}
                  className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  {action.buttonText}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>

          {/* Salon Info Footer */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/20">
              <div className="flex items-center gap-4">
                <span>Salon ID: {salon?.id || 'N/A'}</span>
                <span>•</span>
                <span>Plan: {salon?.selectedPlanId === 1 ? 'Pro' : salon?.selectedPlanId === 2 ? 'Business' : 'Starter'}</span>
              </div>
              <span>v1.0 • {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rejected Page Component
function RejectedPage({ salon, router }: { salon: SalonData | null; router: any }) {
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: XCircleIcon };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6 flex items-center justify-center">
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <XCircleIcon className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Account {statusDisplay.label}</h2>
        <p className="text-white/50 text-sm mb-4">
          We're sorry, but your salon application was not approved.
        </p>
        <div className="bg-red-500/5 border border-red-400/20 rounded-xl p-4 mb-6 text-left">
          <p className="text-red-300/60 text-sm">
            Please contact our support team for more information about the rejection and next steps.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard/support')}
            className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Contact Support
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              router.push('/');
            }}
            className="w-full text-white/20 text-xs hover:text-white/40 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}