// app/dashboard/setup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ScissorsIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

// Types - Updated to match backend response
interface BusinessData {
  name: string;
  description: string;
  email: string;
  phoneNumber: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBookingsPerMonth: number;
  maxServices: number;
  onlineBooking: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  popular: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Alert {
  type: 'success' | 'error';
  message: string;
}

const STEPS = [
  { id: 'business', label: 'Business', icon: BuildingOfficeIcon },
  { id: 'plan', label: 'Plan', icon: CreditCardIcon },
  { id: 'payment', label: 'Payment', icon: ShieldCheckIcon },
  { id: 'review', label: 'Review', icon: CheckCircleIcon },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    description: '',
    email: '',
    phoneNumber: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'United Kingdom',
    postalCode: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
      return;
    }
    
    fetchPlans();
    loadOnboardingProgress();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('setupSalonId');
    router.push('/');
  };

  const loadOnboardingProgress = async () => {
    try {
      setLoadingOnboarding(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/auth/business/salons/onboarding', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Onboarding data:', data);
        
        if (data.data) {
          const savedData = data.data;
          
          if (savedData.businessData) {
            setBusinessData(savedData.businessData);
          }
          
          if (savedData.selectedPlanId) {
            setSelectedPlanId(savedData.selectedPlanId);
          }
          
          if (savedData.salonId) {
            setSalonId(savedData.salonId);
            localStorage.setItem('setupSalonId', savedData.salonId);
          }
          
          if (savedData.currentStep !== undefined) {
            setCurrentStep(savedData.currentStep);
          }
        }
      } else if (response.status === 404) {
        console.log('No onboarding data found, starting fresh');
      } else {
        console.warn('Failed to load onboarding data');
      }
    } catch (error) {
      console.warn('Error loading onboarding progress (non-critical):', error);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  const saveOnboardingProgress = async (step: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        currentStep: step,
        businessData: businessData,
        selectedPlanId: selectedPlanId,
        salonId: salonId,
      };

      console.log('Saving onboarding progress:', payload);

      const response = await fetch('/api/auth/business/salons/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.warn('Failed to save onboarding progress:', errorData);
        return false;
      } else {
        console.log('Onboarding progress saved successfully');
        return true;
      }
    } catch (error) {
      console.warn('Error saving onboarding progress (non-critical):', error);
      return false;
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/auth/subscription/plan', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Plans fetched:', data);
        
        // Handle both array and object responses
        const plansArray = Array.isArray(data) ? data : data.data || data.plans || [];
        setPlans(plansArray);
      } else {
        console.error('Failed to fetch plans');
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleBusinessSubmit = async () => {
    if (!businessData.name.trim()) {
      showAlert('error', 'Please enter your salon name');
      return;
    }
   
    if (!businessData.address.trim()) {
      showAlert('error', 'Please enter your address');
      return;
    }
    if (!businessData.city.trim()) {
      showAlert('error', 'Please enter your city');
      return;
    }
    if (!businessData.postalCode.trim()) {
      showAlert('error', 'Please enter your postal code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('error', 'Please login again');
        router.push('/');
        return;
      }

      const response = await fetch('/api/auth/business/salons/add-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: businessData.name,
          description: businessData.description,
          email: businessData.email,
          phoneNumber: businessData.phoneNumber,
          website: businessData.website,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state || '',
          country: businessData.country,
          postalCode: businessData.postalCode,
          socialMedia: businessData.socialMedia,
        }),
      });

      const rawResponse = await response.text();
      console.log('Raw add-business response:', rawResponse);

      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch {
        data = { message: rawResponse };
      }

      if (response.ok) {
        const newSalonId = data.data?.id || data.id || data.salonId || data.data?.salonId;
        console.log('Salon ID extracted:', newSalonId);
        
        if (newSalonId) {
          setSalonId(newSalonId);
          localStorage.setItem('setupSalonId', newSalonId);
        }
        
        try {
          await saveOnboardingProgress(1);
        } catch (saveError) {
          console.warn('Progress save failed, but continuing:', saveError);
        }
        
        setCurrentStep(1);
        showAlert('success', 'Business registered successfully!');
      } else {
        showAlert('error', data.message || 'Failed to register business');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('error', 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planId: number) => {
    setSelectedPlanId(planId);
    setCurrentStep(2);
    try {
      await saveOnboardingProgress(2);
    } catch (saveError) {
      console.warn('Progress save failed, but continuing:', saveError);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlanId) {
      showAlert('error', 'Please select a plan');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const salonIdFromStorage = localStorage.getItem('setupSalonId');
      
      if (!token || !salonIdFromStorage) {
        showAlert('error', 'Session expired. Please try again.');
        return;
      }

      const response = await fetch('/api/auth/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          salonId: parseInt(salonIdFromStorage),
          planId: selectedPlanId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          await saveOnboardingProgress(3);
        } catch (saveError) {
          console.warn('Progress save failed, but continuing:', saveError);
        }
        setCurrentStep(3);
        showAlert('success', 'Payment successful! Your salon is being reviewed.');
      } else {
        showAlert('error', data.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showAlert('error', 'Payment error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = async (step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step);
      try {
        await saveOnboardingProgress(step);
      } catch (saveError) {
        console.warn('Progress save failed, but continuing:', saveError);
      }
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  if (loadingOnboarding) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <div className="relative w-full h-full">
            <Image
              src="/assets/styke-12.webp"
              alt="Background"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
            <p className="text-white/50 mt-4">Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Image Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
        </div>
      </div>

      {/* Floating Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Alert */}
      {alert && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center px-4">
          <div className={`w-full max-w-md rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slideDown ${
            alert.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex-1 text-sm">{alert.message}</div>
            <button 
              onClick={() => setAlert(null)} 
              className="text-white/70 hover:text-white flex-shrink-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-screen flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-4xl h-full flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="flex items-center justify-center gap-3 mb-1">
              
              <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase">Salon Setup</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {currentStep === 0 && 'Register Your Business'}
              {currentStep === 1 && 'Choose Your Plan'}
              {currentStep === 2 && 'Complete Payment'}
              {currentStep === 3 && 'Setup Complete!'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              {currentStep === 0 && 'Tell us about your salon'}
              {currentStep === 1 && 'Select the best plan for your salon'}
              {currentStep === 2 && 'Secure payment to activate your salon'}
              {currentStep === 3 && 'Your salon is being reviewed'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10 flex-1 flex flex-col max-h-[75vh]">
            {/* Progress Steps */}
            <div className="mb-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                {STEPS.map((step, index) => {
                  const isActive = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <button
                        onClick={() => isActive && goToStep(index)}
                        disabled={!isActive}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm ${
                          isCurrent 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                            : isActive 
                              ? 'bg-purple-500/30 text-white' 
                              : 'bg-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                      <span className={`text-[9px] mt-1 text-center ${
                        isActive ? 'text-white/60' : 'text-white/20'
                      }`}>
                        {step.label}
                      </span>
                      {index < STEPS.length - 1 && (
                        <div className={`w-full h-0.5 mt-2 ${
                          index < currentStep ? 'bg-purple-500' : 'bg-white/10'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentStep === 0 && (
                <BusinessRegistration
                  data={businessData}
                  setData={setBusinessData}
                  onSubmit={handleBusinessSubmit}
                  loading={loading}
                  onLogout={handleLogout}
                />
              )}
              
              {currentStep === 1 && (
                <PlanSelection
                  plans={plans}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={handlePlanSelect}
                  loading={plansLoading || loading}
                  onBack={() => goToStep(0)}
                />
              )}
              
              {currentStep === 2 && (
                <PaymentStep
                  selectedPlan={selectedPlan}
                  onPay={handlePayment}
                  loading={loading}
                  onBack={() => goToStep(1)}
                />
              )}
              
              {currentStep === 3 && (
                <ReviewStep />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-3 flex-shrink-0">
            <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
              © 2026 KROWNBRAIDS. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Animation & Scrollbar Styles */}
      <style jsx>{`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-slideDown { 
          animation: slideDown 0.4s ease-out forwards; 
        }
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

// Step 1: Business Registration
function BusinessRegistration({ 
  data, 
  setData, 
  onSubmit, 
  loading,
  onLogout
}: { 
  data: BusinessData;
  setData: React.Dispatch<React.SetStateAction<BusinessData>>;
  onSubmit: () => void;
  loading: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Salon Name *</label>
          <div className="relative">
            <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
              placeholder="Salon name"
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <div className="col-span-2">
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none resize-none"
            placeholder="Describe your salon..."
            rows={2}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Email</label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
              placeholder="salon@email.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Phone</label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
              placeholder="+44 20 1234 5678"
              disabled={loading}
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Website</label>
          <div className="relative">
            <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="url"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
              placeholder="https://yoursalon.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Postal Code *</label>
          <input
            type="text"
            value={data.postalCode}
            onChange={(e) => setData({ ...data, postalCode: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
            placeholder="SW1A 1AA"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">City *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
            placeholder="London"
            disabled={loading}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Address *</label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-400/50 outline-none"
              placeholder="123 Main Street"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-white/60 text-[10px] uppercase tracking-wider mb-1">Country</label>
          <select
            value={data.country}
            onChange={(e) => setData({ ...data, country: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-400/50 outline-none"
            disabled={loading}
          >
            <option value="United Kingdom">United Kingdom</option>
          </select>
          <p className="text-white/30 text-[9px] mt-0.5">Currently we only operate in the UK</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Return to Login
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-white/20 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/30 transition-all shadow-lg disabled:opacity-60 border border-white/10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Registering...
            </span>
          ) : (
            'Continue to Plans →'
          )}
        </button>
      </div>
    </div>
  );
}

// Step 2: Plan Selection - Updated to handle backend data
function PlanSelection({ 
  plans, 
  selectedPlanId, 
  onSelectPlan, 
  loading,
  onBack
}: { 
  plans: Plan[];
  selectedPlanId: number | null;
  onSelectPlan: (id: number) => void;
  loading: boolean;
  onBack: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
        <p className="text-white/50 mt-2 text-sm">Loading plans...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-white/50 text-sm">No plans available</p>
      </div>
    );
  }

  // Get the best feature to highlight
  const getFeatureLabel = (plan: Plan) => {
    const features = [];
    if (plan.onlineBooking) features.push('Online Booking');
    if (plan.analytics) features.push('Analytics');
    if (plan.prioritySupport) features.push('Priority Support');
    if (plan.customBranding) features.push('Custom Branding');
    if (plan.maxBookingsPerMonth) features.push(`${plan.maxBookingsPerMonth} Bookings/mo`);
    if (plan.maxServices) features.push(`${plan.maxServices} Services`);
    return features.slice(0, 3).join(' • ');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${
              selectedPlanId === plan.id
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            } ${plan.popular ? 'relative overflow-hidden' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-yellow-500 to-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                  POPULAR
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {plan.name}
                  {plan.code && (
                    <span className="text-white/30 text-[8px] ml-1 font-normal">
                      ({plan.code})
                    </span>
                  )}
                </h3>
                <p className="text-white/40 text-[10px]">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">£{plan.monthlyPrice}</p>
                <p className="text-white/30 text-[9px]">/month</p>
                {plan.yearlyPrice && (
                  <p className="text-white/20 text-[8px]">£{plan.yearlyPrice}/year</p>
                )}
              </div>
            </div>
            
            <div className="mt-1.5">
              <p className="text-[9px] text-white/50">
                {getFeatureLabel(plan)}
              </p>
            </div>

            {selectedPlanId === plan.id && (
              <div className="mt-1">
                <span className="text-[8px] text-purple-400 font-medium uppercase border border-purple-400/30 rounded-full px-2 py-0.5">
                  Selected
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => selectedPlanId && onSelectPlan(selectedPlanId)}
          disabled={!selectedPlanId}
          className="flex-1 bg-white/20 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/30 transition-all shadow-lg disabled:opacity-60 border border-white/10"
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}

// Step 3: Payment
function PaymentStep({ 
  selectedPlan, 
  onPay, 
  loading,
  onBack 
}: { 
  selectedPlan?: Plan;
  onPay: () => void;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/40 text-[10px]">Plan</p>
            <p className="text-white font-medium text-sm">
              {selectedPlan?.name || 'Not selected'}
              {selectedPlan?.code && (
                <span className="text-white/30 text-[10px] ml-1">({selectedPlan.code})</span>
              )}
            </p>
            <p className="text-white/40 text-[9px]">{selectedPlan?.description}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[10px]">Amount</p>
            <p className="text-lg font-bold text-white">£{selectedPlan?.monthlyPrice || 0}</p>
            <p className="text-white/30 text-[8px]">/month</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-2.5">
        <div className="flex items-start gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 text-xs font-medium">Secure Payment</p>
            <p className="text-blue-300/70 text-[9px]">Your payment is encrypted and secure.</p>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      {selectedPlan && (
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
          <p className="text-white/40 text-[9px] mb-1">Plan Features</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedPlan.maxBookingsPerMonth && (
              <span className="text-[8px] text-white/50 bg-white/5 px-2 py-0.5 rounded">
                {selectedPlan.maxBookingsPerMonth} Bookings/mo
              </span>
            )}
            {selectedPlan.maxServices && (
              <span className="text-[8px] text-white/50 bg-white/5 px-2 py-0.5 rounded">
                {selectedPlan.maxServices} Services
              </span>
            )}
            {selectedPlan.onlineBooking && (
              <span className="text-[8px] text-green-400/70 bg-green-500/10 px-2 py-0.5 rounded">
                Online Booking
              </span>
            )}
            {selectedPlan.analytics && (
              <span className="text-[8px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded">
                Analytics
              </span>
            )}
            {selectedPlan.prioritySupport && (
              <span className="text-[8px] text-yellow-400/70 bg-yellow-500/10 px-2 py-0.5 rounded">
                Priority Support
              </span>
            )}
            {selectedPlan.customBranding && (
              <span className="text-[8px] text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded">
                Custom Branding
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onPay}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-2.5 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CreditCardIcon className="h-4 w-4" />
              Pay £{selectedPlan?.monthlyPrice || 0}/mo
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// Step 4: Review
function ReviewStep() {
  const router = useRouter();

  return (
    <div className="text-center space-y-3 py-2">
      <div className="text-4xl">🎉</div>
      <h2 className="text-lg font-bold text-white">Payment Successful!</h2>
      <p className="text-white/50 text-sm">
        Your salon registration is complete and pending admin approval.
      </p>

      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 text-left">
        <div className="flex items-start gap-2">
          <ClockIcon className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-xs font-medium">Pending Approval</p>
            <p className="text-yellow-300/70 text-[10px]">
              Our admin team is reviewing your business details.
              <br />
              <span className="text-[9px]">This usually takes 24-48 hours.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-white/20 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/30 transition-all"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => router.push('/dashboard/support')}
          className="w-full bg-white/5 py-2 rounded-lg text-xs text-white/60 hover:text-white transition-all"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

// Clock Icon Component
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}