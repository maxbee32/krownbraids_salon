"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  BuildingOfficeIcon
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

// 🔥 Helper function to format status for display
const formatStatus = (status: string): { label: string; color: string; icon: any } => {
  const statusMap: { [key: string]: { label: string; color: string; icon: any } } = {
    'PENDING_APPROVAL': {
      label: 'Pending Approval',
      color: 'text-yellow-400',
      icon: ClockIcon
    },
    'PENDING': {
      label: 'Pending Approval',
      color: 'text-yellow-400',
      icon: ClockIcon
    },
    'APPROVED': {
      label: 'Approved',
      color: 'text-green-400',
      icon: CheckCircleIcon
    },
    'ACTIVE': {
      label: 'Active',
      color: 'text-green-400',
      icon: CheckCircleIcon
    },
    'REJECTED': {
      label: 'Rejected',
      color: 'text-red-400',
      icon: XCircleIcon
    },
    'DECLINED': {
      label: 'Declined',
      color: 'text-red-400',
      icon: XCircleIcon
    },
    'REVIEW': {
      label: 'Under Review',
      color: 'text-yellow-400',
      icon: ClockIcon
    },
    'COMPLETED': {
      label: 'Complete',
      color: 'text-green-400',
      icon: CheckCircleIcon
    }
  };

  return statusMap[status] || {
    label: status?.replace(/_/g, ' ') || 'Unknown',
    color: 'text-gray-400',
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

        // Step 1: Fetch onboarding data to get salonId
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
        console.log('📦 Onboarding data:', onboardingData);

        // Get the salon ID from the onboarding data
        const salonId = onboardingData.salonId || onboardingData.id;
        
        if (!salonId) {
          console.warn('⚠️ No salon ID found in onboarding data');
          setError('No salon found');
          setLoading(false);
          return;
        }

        console.log(`🔍 Fetching full salon data for ID: ${salonId}`);

        // Step 2: Fetch the full salon data using the salon ID
        const salonResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (salonResponse.ok) {
          const salonData = await salonResponse.json();
          console.log('✅ Full salon data:', JSON.stringify(salonData, null, 2));
          
          // Extract the salon data (might be nested in 'data' property)
          const fullSalonData = salonData.data || salonData;
          
          console.log('📦 Extracted salon:', fullSalonData);
          console.log('📦 Salon name:', fullSalonData?.name);
          console.log('📦 Salon status:', fullSalonData?.status);
          
          if (fullSalonData && fullSalonData.id) {
            setSalon(fullSalonData);
          } else {
            console.warn('⚠️ No salon data found in response');
            setError('No salon data found');
          }
        } else {
          // If the salon API fails, use the onboarding data with default values
          console.warn('⚠️ Failed to fetch full salon data, using onboarding data');
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-white/30 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no salon data, show loading
  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4">Loading salon data...</p>
        </div>
      </div>
    );
  }

  // Check salon status
  const salonStatus = salon.status || salon.onboardingStep || 'PENDING_APPROVAL';
  const formattedStatus = formatStatus(salonStatus);
  console.log('🔍 Final salon status:', salonStatus);
  console.log('🔍 Formatted status:', formattedStatus.label);
  console.log('🔍 Final salon name:', salon.name);

  // PENDING_APPROVAL Status
  if (salonStatus === 'PENDING_APPROVAL' || salonStatus === 'PENDING' || salonStatus === 'REVIEW') {
    return <PendingApprovalPage salon={salon} router={router} />;
  }

  // APPROVED Status
  if (salonStatus === 'APPROVED' || salonStatus === 'ACTIVE') {
    return <ApprovedDashboard salon={salon} router={router} />;
  }

  // REJECTED Status
  if (salonStatus === 'REJECTED' || salonStatus === 'DECLINED') {
    return <RejectedPage salon={salon} router={router} />;
  }

  // Fallback - show pending approval
  return <PendingApprovalPage salon={salon} router={router} />;
}

// Pending Approval Page Component
function PendingApprovalPage({ salon, router }: { salon: SalonData | null; router: any }) {
  // 🔥 Format the status for display
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Pending Approval', color: 'text-yellow-400', icon: ClockIcon };
  
  const salonName = salon?.name || 'Your Salon';
  const salonAddress = salon?.address || '';
  const salonCity = salon?.city || '';
  const salonId = salon?.id || 'N/A';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Salon Info Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{salonName}</h2>
                <p className="text-white/40 text-sm">
                  {salonAddress && salonCity ? `${salonAddress}, ${salonCity}` : 'Address not provided'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-white/30 text-xs">Salon ID: {salonId}</p>
                  <span className={`text-xs flex items-center gap-1 ${statusDisplay.color}`}>
                    <statusDisplay.icon className="h-3 w-3" />
                    {statusDisplay.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approval Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <ClockIcon className="h-12 w-12 text-yellow-400" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-black">!</span>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2">Account Pending Approval</h1>
            <p className="text-white/60 text-lg mb-2">
              Your salon <span className="text-white font-semibold">"{salonName}"</span> is being reviewed
            </p>
            <p className="text-white/40 text-sm mb-6">
              Our admin team is verifying your business details and payment information.
            </p>

            {/* Status Timeline */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Step 1: Registration Complete</p>
                  <p className="text-xs text-white/40">Your business and payment details have been submitted</p>
                </div>
              </div>
              <div className="border-l-2 border-yellow-400/30 ml-2.5 pl-6 mt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <ClockIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Step 2: Admin Review (In Progress)</p>
                    <p className="text-xs text-white/40">Our team is reviewing your application</p>
                    <p className="text-xs text-white/30 mt-1">⏱️ Estimated time: 24-48 hours</p>
                  </div>
                </div>
              </div>
              <div className="border-l-2 border-white/10 ml-2.5 pl-6 mt-2">
                <div className="flex items-start gap-3 opacity-50">
                  <div className="mt-1">
                    <ScissorsIcon className="h-5 w-5 text-white/30" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/50">Step 3: Add Services & Go Live</p>
                    <p className="text-xs text-white/30">Once approved, you can add your services</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-yellow-300 text-sm mb-1">📌 What happens next?</h3>
              <ul className="text-yellow-300/70 text-xs space-y-1">
                <li>• Our admin team will verify your business details</li>
                <li>• You&apos;ll receive an email notification once approved</li>
                <li>• After approval, you can start adding your services</li>
                <li>• Your salon will be live and ready for bookings</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/dashboard/setup')}
                className="bg-white/10 py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowRightIcon className="h-4 w-4" />
                View Setup
              </button>
              <button
                onClick={() => router.push('/dashboard/support')}
                className="bg-white/10 py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Contact Support
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                router.push('/');
              }}
              className="mt-4 text-white/30 text-xs hover:text-white/50 transition-all"
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
  const salonName = salon?.name || 'Salon';
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Approved', color: 'text-green-400', icon: CheckCircleIcon };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-white/40 text-sm">
                Welcome back, {salonName}! 🎉
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`bg-green-500/20 ${statusDisplay.color} text-xs px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1`}>
                <statusDisplay.icon className="h-3 w-3" />
                {statusDisplay.label}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  router.push('/');
                }}
                className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Quick Start Banner */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">🚀 Get Started!</h2>
                <p className="text-white/60 text-sm">
                  Your salon is approved! Start adding your services to go live.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/services/add')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
              >
                <ScissorsIcon className="h-5 w-5" />
                Add Services
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-white/40 text-xs">Today&apos;s Bookings</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-white/40 text-xs">Total Clients</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold">£0</p>
                  <p className="text-white/40 text-xs">Monthly Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-2xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <ScissorsIcon className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-white/40 text-xs">Services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ScissorsIcon className="h-5 w-5 text-purple-400" />
                Services
              </h3>
              <p className="text-white/40 text-sm mb-4">Add and manage your salon services</p>
              <button
                onClick={() => router.push('/dashboard/services')}
                className="w-full bg-white/10 py-2 rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                Manage Services →
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
                Bookings
              </h3>
              <p className="text-white/40 text-sm mb-4">View and manage your appointments</p>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="w-full bg-white/10 py-2 rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                View Bookings →
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CogIcon className="h-5 w-5 text-gray-400" />
                Settings
              </h3>
              <p className="text-white/40 text-sm mb-4">Update your salon profile and settings</p>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="w-full bg-white/10 py-2 rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                Go to Settings →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rejected Page Component
function RejectedPage({ salon, router }: { salon: SalonData | null; router: any }) {
  const statusDisplay = salon?.status ? formatStatus(salon.status) : { label: 'Rejected', color: 'text-red-400', icon: XCircleIcon };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 max-w-md w-full text-center">
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Account {statusDisplay.label}</h2>
        <p className="text-white/50 text-sm mb-4">
          We&apos;re sorry, but your salon application was not approved.
        </p>
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-300 text-xs">
            Please contact our support team for more information about the rejection and next steps.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/support')}
          className="w-full bg-white/20 py-3 rounded-xl text-sm font-medium hover:bg-white/30 transition-all"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}