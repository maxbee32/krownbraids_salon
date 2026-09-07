// app/dashboard/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";

// Types
interface SalonSettings {
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
  youtube: string;
  tiktok: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  timezone: string;
  currency: string;
  bookingBuffer: number;
  maxBookingsPerDay: number;
  cancellationPolicy: string;
  termsAndConditions: string;
  privacyPolicy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingReminders: boolean;
  bookingConfirmations: boolean;
  marketingEmails: boolean;
  reviewNotifications: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salon, setSalon] = useState<SalonSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'notifications' | 'security' | 'billing'>('profile');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    email: '',
    phoneNumber: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: ''
  });

  const [hoursForm, setHoursForm] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true }
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    bookingReminders: true,
    bookingConfirmations: true,
    marketingEmails: false,
    reviewNotifications: true
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [billingForm, setBillingForm] = useState({
    timezone: 'Europe/London',
    currency: 'GBP',
    bookingBuffer: 30,
    maxBookingsPerDay: 20,
    cancellationPolicy: '24 hours notice required for full refund',
    termsAndConditions: '',
    privacyPolicy: ''
  });

  // Fetch salon data
  useEffect(() => {
    fetchSalonData();
  }, []);

  const fetchSalonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/');
        return;
      }

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

      const detailsResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        const salonDetails = details.data || details;
        setSalon(salonDetails);

        // Populate forms
        setProfileForm({
          name: salonDetails.name || '',
          description: salonDetails.description || '',
          address: salonDetails.address || '',
          city: salonDetails.city || '',
          state: salonDetails.state || '',
          country: salonDetails.country || 'United Kingdom',
          postalCode: salonDetails.postalCode || '',
          email: salonDetails.email || '',
          phoneNumber: salonDetails.phoneNumber || '',
          website: salonDetails.website || '',
          facebook: salonDetails.facebook || '',
          instagram: salonDetails.instagram || '',
          twitter: salonDetails.twitter || '',
          youtube: salonDetails.youtube || '',
          tiktok: salonDetails.tiktok || ''
        });

        if (salonDetails.openingHours) {
          setHoursForm(salonDetails.openingHours);
        }

        if (salonDetails.timezone) {
          setBillingForm(prev => ({ ...prev, timezone: salonDetails.timezone }));
        }
        if (salonDetails.currency) {
          setBillingForm(prev => ({ ...prev, currency: salonDetails.currency }));
        }
        if (salonDetails.bookingBuffer) {
          setBillingForm(prev => ({ ...prev, bookingBuffer: salonDetails.bookingBuffer }));
        }
        if (salonDetails.maxBookingsPerDay) {
          setBillingForm(prev => ({ ...prev, maxBookingsPerDay: salonDetails.maxBookingsPerDay }));
        }
        if (salonDetails.cancellationPolicy) {
          setBillingForm(prev => ({ ...prev, cancellationPolicy: salonDetails.cancellationPolicy }));
        }
        if (salonDetails.termsAndConditions) {
          setBillingForm(prev => ({ ...prev, termsAndConditions: salonDetails.termsAndConditions }));
        }
        if (salonDetails.privacyPolicy) {
          setBillingForm(prev => ({ ...prev, privacyPolicy: salonDetails.privacyPolicy }));
        }
      }

    } catch (err) {
      console.error('Error fetching salon data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch(`/api/auth/business/salons/${salon?.id}`, {
      //   method: 'PUT',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(profileForm),
      // });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch(`/api/auth/business/salons/${salon?.id}/hours`, {
      //   method: 'PUT',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(hoursForm),
      // });

      setSuccess('Opening hours updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update opening hours');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch(`/api/auth/business/salons/${salon?.id}/notifications`, {
      //   method: 'PUT',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(notificationSettings),
      // });

      setSuccess('Notification settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError('Passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     currentPassword: securityForm.currentPassword,
      //     newPassword: securityForm.newPassword,
      //   }),
      // });

      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // In a real app, you would call the API
      // const response = await fetch(`/api/auth/business/salons/${salon?.id}/settings`, {
      //   method: 'PUT',
      //   headers: { 
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(billingForm),
      // });

      setSuccess('Business settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: BuildingOfficeIcon },
    { id: 'hours', label: 'Hours', icon: ClockIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', label: 'Business', icon: CreditCardIcon },
  ];

  const dayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4 text-sm">Loading settings...</p>
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl hover:bg-white/10 transition-all flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white/60" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
              <p className="text-white/40 text-sm">Manage your salon settings and preferences</p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 animate-fade-in">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400/60 hover:text-red-400 flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-white/10 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Salon Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                      placeholder="Your salon name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={profileForm.description}
                      onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      rows={3}
                      placeholder="Describe your salon..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">State/Region</label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="State or region"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={profileForm.postalCode}
                        onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Postal code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="contact@salon.com"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="+44 7000 000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="https://your-salon.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Instagram</label>
                      <input
                        type="text"
                        value={profileForm.instagram}
                        onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="@handle"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Facebook</label>
                      <input
                        type="text"
                        value={profileForm.facebook}
                        onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Facebook page"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Twitter/X</label>
                      <input
                        type="text"
                        value={profileForm.twitter}
                        onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="@handle"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && (
            <form onSubmit={handleHoursSubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Opening Hours</h2>
                <p className="text-white/40 text-sm mb-4">Set your salon's operating hours for each day</p>

                <div className="space-y-4">
                  {Object.entries(hoursForm).map(([day, hours]) => (
                    <div key={day} className="flex flex-wrap items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <div className="w-24">
                        <span className="text-white font-medium text-sm">{dayNames[day]}</span>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => {
                            setHoursForm({
                              ...hoursForm,
                              [day]: { ...hours, closed: e.target.checked }
                            });
                          }}
                          className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500/20"
                        />
                        <span className="text-white/60">Closed</span>
                      </label>
                      {!hours.closed && (
                        <>
                          <div className="flex items-center gap-2">
                            <label className="text-white/40 text-sm">Open</label>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => {
                                setHoursForm({
                                  ...hoursForm,
                                  [day]: { ...hours, open: e.target.value }
                                });
                              }}
                              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-white/40 text-sm">Close</label>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => {
                                setHoursForm({
                                  ...hoursForm,
                                  [day]: { ...hours, close: e.target.value }
                                });
                              }}
                              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Hours'}
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
                <p className="text-white/40 text-sm mb-4">Choose how you want to receive notifications</p>

                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => {
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-white text-sm">{label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNotificationSettings({
                              ...notificationSettings,
                              [key]: !value
                            });
                          }}
                          className={`w-12 h-6 rounded-full transition-all ${
                            value ? 'bg-purple-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                            value ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Notifications'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                <p className="text-white/40 text-sm mb-4">Update your account password</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Current Password</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">New Password</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* Business Settings Tab */}
          {activeTab === 'billing' && (
            <form onSubmit={handleBillingSubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Business Settings</h2>
                <p className="text-white/40 text-sm mb-4">Configure your business preferences</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Time Zone</label>
                      <select
                        value={billingForm.timezone}
                        onChange={(e) => setBillingForm({ ...billingForm, timezone: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="Europe/London">GMT (London)</option>
                        <option value="Europe/Paris">CET (Paris)</option>
                        <option value="America/New_York">EST (New York)</option>
                        <option value="America/Los_Angeles">PST (Los Angeles)</option>
                        <option value="Asia/Dubai">GST (Dubai)</option>
                        <option value="Asia/Tokyo">JST (Tokyo)</option>
                        <option value="Australia/Sydney">AEDT (Sydney)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Currency</label>
                      <select
                        value={billingForm.currency}
                        onChange={(e) => setBillingForm({ ...billingForm, currency: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="NGN">NGN (₦)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Booking Buffer (minutes)</label>
                      <input
                        type="number"
                        value={billingForm.bookingBuffer}
                        onChange={(e) => setBillingForm({ ...billingForm, bookingBuffer: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        min="0"
                        step="5"
                        placeholder="30"
                      />
                      <p className="text-white/20 text-xs mt-1">Time between bookings</p>
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Max Bookings Per Day</label>
                      <input
                        type="number"
                        value={billingForm.maxBookingsPerDay}
                        onChange={(e) => setBillingForm({ ...billingForm, maxBookingsPerDay: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        min="1"
                        placeholder="20"
                      />
                      <p className="text-white/20 text-xs mt-1">Maximum appointments per day</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Cancellation Policy</label>
                    <textarea
                      value={billingForm.cancellationPolicy}
                      onChange={(e) => setBillingForm({ ...billingForm, cancellationPolicy: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      rows={2}
                      placeholder="24 hours notice required for full refund"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Terms & Conditions</label>
                    <textarea
                      value={billingForm.termsAndConditions}
                      onChange={(e) => setBillingForm({ ...billingForm, termsAndConditions: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      rows={3}
                      placeholder="Your salon's terms and conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-1">Privacy Policy</label>
                    <textarea
                      value={billingForm.privacyPolicy}
                      onChange={(e) => setBillingForm({ ...billingForm, privacyPolicy: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      rows={3}
                      placeholder="Your salon's privacy policy..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Business Settings'}
              </button>
            </form>
          )}
        </div>
      </div>

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
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}