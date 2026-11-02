// app/dashboard/settings/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IdentificationIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  LockClosedIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CameraIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  logoUrl: string;
  coverImageUrl: string;
  openingHours: {
    monday:    { open: string; close: string; closed: boolean };
    tuesday:   { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday:  { open: string; close: string; closed: boolean };
    friday:    { open: string; close: string; closed: boolean };
    saturday:  { open: string; close: string; closed: boolean };
    sunday:    { open: string; close: string; closed: boolean };
  };
  timezone: string;
  currency: string;
  cancellationPolicy: string;
  termsAndConditions: string;
  privacyPolicy: string;
  notificationSettings?: {
    emailNotifications?: boolean;
    bookingReminders?: boolean;
    bookingConfirmations?: boolean;
    marketingEmails?: boolean;
    reviewNotifications?: boolean;
  };
  // Plan limits (read-only, populated by backend enrichWithSubscription)
  maxServices?: number | null;
  maxBookingsPerMonth?: number | null;
  subscriptionLevel?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  bookingReminders: boolean;
  bookingConfirmations: boolean;
  marketingEmails: boolean;
  reviewNotifications: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shared input styles                                                */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const selectClass = `${inputClass} [color-scheme:dark]`;
const labelClass = "block text-white/60 text-sm font-medium mb-1";
const cardClass =
  "relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salon, setSalon] = useState<SalonSettings | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "hours" | "notifications" | "security" | "billing"
  >("profile");

  /* ---------- Edit gates ---------- */
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);

  /* ---------- Image upload refs ---------- */
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
    website: "",
    logoUrl: "",
    coverImageUrl: "",
  });
  const [profileBackup, setProfileBackup] = useState(profileForm);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [hoursForm, setHoursForm] = useState({
    monday:    { open: "09:00", close: "18:00", closed: false },
    tuesday:   { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday:  { open: "09:00", close: "18:00", closed: false },
    friday:    { open: "09:00", close: "18:00", closed: false },
    saturday:  { open: "10:00", close: "17:00", closed: false },
    sunday:    { open: "10:00", close: "16:00", closed: true },
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    bookingReminders: true,
    bookingConfirmations: true,
    marketingEmails: false,
    reviewNotifications: true,
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* 🔑 Business form — only editable fields. Plan limits are read-only. */
  const [billingForm, setBillingForm] = useState({
    timezone: "Europe/London",
    cancellationPolicy: "24 hours notice required for full refund",
    termsAndConditions: "",
    privacyPolicy: "",
  });
  const [billingBackup, setBillingBackup] = useState(billingForm);

  /* ---------- Helpers ---------- */

  const rewriteSalonImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("/api/uploads/salon/")) return url;
    if (url.startsWith("data:")) return url;

    const match = url.match(/\/salons\/images\/(.+)$/);
    if (match) return `/api/uploads/salon/${match[1]}`;

    if (url.startsWith("/") && !url.startsWith("//")) {
      return `/api/uploads/salon${url}`;
    }

    return url;
  };

  /* ---------- Fetch ---------- */

  useEffect(() => {
    fetchSalonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      setSuccess(null);
      setError(null);
      setSaving(false);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  const fetchSalonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const salonResponse = await fetch("/api/auth/business/salons/onboarding", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!salonResponse.ok) throw new Error("Failed to fetch salon data");

      const salonData = await salonResponse.json();
      const salonId = salonData.salonId || salonData.id;
      if (!salonId) {
        router.push("/dashboard/setup");
        return;
      }

      const detailsResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        const salonDetails = details.data || details;
        setSalon(salonDetails);

        const nextProfile = {
          name: salonDetails.name || "",
          description: salonDetails.description || "",
          address: salonDetails.address || "",
          city: salonDetails.city || "",
          state: salonDetails.state || "",
          country: salonDetails.country || "United Kingdom",
          postalCode: salonDetails.postalCode || "",
          email: salonDetails.email || "",
          phoneNumber: salonDetails.phoneNumber || "",
          website: salonDetails.website || "",
          logoUrl: salonDetails.logoUrl || "",
          coverImageUrl: salonDetails.coverImageUrl || "",
        };
        setProfileForm(nextProfile);
        setProfileBackup(nextProfile);

        setLogoPreview(rewriteSalonImageUrl(salonDetails.logoUrl));
        setCoverPreview(rewriteSalonImageUrl(salonDetails.coverImageUrl));

        if (salonDetails.openingHours) {
          setHoursForm(salonDetails.openingHours);
        }

        if (salonDetails.notificationSettings) {
          setNotificationSettings((prev) => ({
            ...prev,
            ...salonDetails.notificationSettings,
          }));
        }

        const nextBilling = {
          timezone: salonDetails.timezone || "Europe/London",
          cancellationPolicy:
            salonDetails.cancellationPolicy ||
            "24 hours notice required for full refund",
          termsAndConditions: salonDetails.termsAndConditions || "",
          privacyPolicy: salonDetails.privacyPolicy || "",
        };
        setBillingForm(nextBilling);
        setBillingBackup(nextBilling);
      }
    } catch (err) {
      console.error("Error fetching salon data:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Image handlers ---------- */

  const uploadSalonImage = async (file: File, kind: "logo" | "cover") => {
    const salonId = salon?.id;
    if (!salonId) {
      setError("Salon not loaded yet");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const localPreview = URL.createObjectURL(file);
    if (kind === "logo") setLogoPreview(localPreview);
    else setCoverPreview(localPreview);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/auth/business/salons/images/${salonId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      const uploadedUrl = data.url as string;
      const proxiedUrl = rewriteSalonImageUrl(uploadedUrl) || uploadedUrl;

      if (kind === "logo") {
        setLogoPreview(proxiedUrl);
        setProfileForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      } else {
        setCoverPreview(proxiedUrl);
        setProfileForm((prev) => ({ ...prev, coverImageUrl: uploadedUrl }));
      }
    } catch (err) {
      if (kind === "logo") setLogoPreview(profileForm.logoUrl ? rewriteSalonImageUrl(profileForm.logoUrl) : null);
      else setCoverPreview(profileForm.coverImageUrl ? rewriteSalonImageUrl(profileForm.coverImageUrl) : null);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploadingImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    await uploadSalonImage(file, "logo");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Cover image must be less than 10MB");
      return;
    }

    await uploadSalonImage(file, "cover");
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setProfileForm((prev) => ({ ...prev, logoUrl: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const removeCover = () => {
    setCoverPreview(null);
    setProfileForm((prev) => ({ ...prev, coverImageUrl: "" }));
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* ---------- Save handlers ---------- */

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");
      if (!salon?.id) throw new Error("Salon not loaded");

      const res = await fetch(`/api/auth/business/salons/${salon.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update profile");
      }

      flashSuccess("Profile updated.");
      setProfileBackup(profileForm);
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");
      if (!salon?.id) throw new Error("Salon not loaded");

      const res = await fetch(`/api/auth/business/salons/${salon.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openingHours: hoursForm }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update opening hours");
      }

      flashSuccess("Opening hours updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update opening hours");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");
      if (!salon?.id) throw new Error("Salon not loaded");

      const res = await fetch(`/api/auth/business/salons/${salon.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationSettings }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update notification settings");
      }

      flashSuccess("Notification settings updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update notification settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }
    if (securityForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change password");
      }

      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flashSuccess("Password changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");
      if (!salon?.id) throw new Error("Salon not loaded");

      // Currency is forced to GBP — the user can't change it
      const payload = {
        ...billingForm,
        currency: "GBP",
      };

      const res = await fetch(`/api/auth/business/salons/${salon.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update business settings");
      }

      flashSuccess("Business settings updated.");
      setBillingBackup(billingForm);
      setEditingBilling(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update business settings"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Misc ---------- */

  const tabs = [
    { id: "profile", label: "Profile", icon: IdentificationIcon },
    { id: "hours", label: "Hours", icon: CalendarDaysIcon },
    { id: "notifications", label: "Notifications", icon: MegaphoneIcon },
    { id: "security", label: "Security", icon: LockClosedIcon },
    { id: "billing", label: "Business", icon: AdjustmentsHorizontalIcon },
  ] as const;

  const dayNames: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading settings</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Manage your salon profile, opening hours, notifications and security.
        </p>
      </div>

      {/* Success */}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
        >
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
        >
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400 flex-shrink-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                active
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============ Profile ============ */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* ---- Images card ---- */}
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Salon images
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Upload a logo and cover image for your salon.
                </p>
              </div>
              {!editingProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileBackup(profileForm);
                    setEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm(profileBackup);
                    setLogoPreview(rewriteSalonImageUrl(profileBackup.logoUrl));
                    setCoverPreview(rewriteSalonImageUrl(profileBackup.coverImageUrl));
                    setEditingProfile(false);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            {/* Cover image */}
            <div className="mb-6">
              <label className={labelClass}>Cover image</label>
              <div className="relative group">
                <div
                  className={`relative w-full h-40 md:h-52 rounded-xl overflow-hidden border border-white/10 ${
                    coverPreview
                      ? "bg-cover bg-center"
                      : "bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10"
                  }`}
                  style={
                    coverPreview
                      ? { backgroundImage: `url(${coverPreview})` }
                      : undefined
                  }
                >
                  {!coverPreview && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <PhotoIcon className="h-10 w-10 text-white/20" />
                      <p className="text-white/30 text-sm">No cover image</p>
                    </div>
                  )}

                  {editingProfile && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-colors disabled:opacity-60"
                      >
                        <CameraIcon className="h-4 w-4" />
                        {coverPreview ? "Change" : "Upload"}
                      </button>
                      {coverPreview && (
                        <button
                          type="button"
                          onClick={removeCover}
                          disabled={uploadingImage}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-red-500/30 hover:bg-red-500/50 text-red-200 border border-red-400/30 transition-colors disabled:opacity-60"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={!editingProfile || uploadingImage}
                  className="hidden"
                />
              </div>
              <p className="text-white/25 text-xs mt-1.5">
                Recommended: 1200×400px · Max 10MB · JPG, PNG or WebP
              </p>
            </div>

            {/* Logo */}
            <div>
              <label className={labelClass}>Salon logo</label>
              <div className="flex items-center gap-5">
                <div className="relative group flex-shrink-0">
                  <div
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 flex items-center justify-center ${
                      logoPreview
                        ? "bg-cover bg-center"
                        : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
                    }`}
                    style={
                      logoPreview
                        ? { backgroundImage: `url(${logoPreview})` }
                        : undefined
                    }
                  >
                    {!logoPreview && (
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {getInitials(profileForm.name || "S")}
                      </span>
                    )}

                    {editingProfile && !uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-colors"
                          aria-label="Upload logo"
                        >
                          <CameraIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={!editingProfile || uploadingImage}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-sm">
                    Upload a square logo for your salon.
                  </p>
                  <p className="text-white/25 text-xs mt-1">
                    Recommended: 400×400px · Max 5MB · JPG, PNG or WebP
                  </p>

                  {editingProfile && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-60"
                      >
                        <CameraIcon className="h-3.5 w-3.5" />
                        {logoPreview ? "Change logo" : "Upload logo"}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          disabled={uploadingImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-400/20 transition-colors disabled:opacity-60"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ---- Info card ---- */}
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-base font-semibold text-white">
                Salon information
              </h2>
              {!editingProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileBackup(profileForm);
                    setEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm(profileBackup);
                    setLogoPreview(rewriteSalonImageUrl(profileBackup.logoUrl));
                    setCoverPreview(rewriteSalonImageUrl(profileBackup.coverImageUrl));
                    setEditingProfile(false);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Salon name *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={inputClass}
                  required
                  placeholder="Your salon name"
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, description: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Describe your salon…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, address: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, city: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className={labelClass}>County / Region</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, state: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="County or region"
                  />
                </div>
                <div>
                  <label className={labelClass}>Postcode</label>
                  <input
                    type="text"
                    value={profileForm.postalCode}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, postalCode: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="e.g. SW1A 1AA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="you@salon.co.uk"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone number</label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                    }
                    disabled={!editingProfile}
                    className={inputClass}
                    placeholder="07123 456789"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={inputClass}
                  placeholder="https://your-salon.co.uk"
                />
              </div>
            </div>
          </div>

          {editingProfile && <SaveButton saving={saving} label="Save profile" />}
        </form>
      )}

      {/* ============ Hours ============ */}
      {activeTab === "hours" && (
        <form onSubmit={handleHoursSubmit} className="space-y-6">
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <h2 className="text-base font-semibold text-white mb-2">
              Opening hours
            </h2>
            <p className="text-white/40 text-sm mb-5">
              Set your salon&apos;s operating hours for each day of the week.
            </p>

            <div className="space-y-2.5">
              {Object.entries(hoursForm).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-24">
                    <span className="text-white text-sm font-medium">
                      {dayNames[day]}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) =>
                        setHoursForm({
                          ...hoursForm,
                          [day]: { ...hours, closed: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded bg-white/5 border-white/20 text-cyan-500 focus:ring-cyan-500/20"
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
                          onChange={(e) =>
                            setHoursForm({
                              ...hoursForm,
                              [day]: { ...hours, open: e.target.value },
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-white/40 text-sm">Close</label>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) =>
                            setHoursForm({
                              ...hoursForm,
                              [day]: { ...hours, close: e.target.value },
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <SaveButton saving={saving} label="Save hours" />
        </form>
      )}

      {/* ============ Notifications ============ */}
      {activeTab === "notifications" && (
        <form onSubmit={handleNotificationSubmit} className="space-y-6">
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <h2 className="text-base font-semibold text-white mb-2">
              Notification preferences
            </h2>
            <p className="text-white/40 text-sm mb-5">
              Choose how and when you want to be notified.
            </p>

            <div className="space-y-2.5">
              {Object.entries(notificationSettings).map(([key, value]) => {
                const label = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase());
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <span className="text-white/80 text-sm">{label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [key]: !value,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        value
                          ? "bg-gradient-to-r from-cyan-500 to-purple-500"
                          : "bg-white/10"
                      }`}
                      aria-label={`Toggle ${label}`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                          value ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <SaveButton saving={saving} label="Save notifications" />
        </form>
      )}

      {/* ============ Security ============ */}
      {activeTab === "security" && (
        <form onSubmit={handleSecuritySubmit} className="space-y-6">
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <h2 className="text-base font-semibold text-white mb-2">
              Change password
            </h2>
            <p className="text-white/40 text-sm mb-5">
              Use at least 8 characters with a mix of letters, numbers and symbols.
            </p>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Current password</label>
                <input
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(e) =>
                    setSecurityForm({
                      ...securityForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) =>
                    setSecurityForm({ ...securityForm, newPassword: e.target.value })
                  }
                  className={inputClass}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) =>
                    setSecurityForm({
                      ...securityForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </div>

          <SaveButton saving={saving} label="Change password" />
        </form>
      )}

      {/* ============ Business ============ */}
      {activeTab === "billing" && (
        <form onSubmit={handleBillingSubmit} className="space-y-6">
          <div className={cardClass}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-base font-semibold text-white">
                Business settings
              </h2>
              {!editingBilling ? (
                <button
                  type="button"
                  onClick={() => {
                    setBillingBackup(billingForm);
                    setEditingBilling(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBillingForm(billingBackup);
                    setEditingBilling(false);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <p className="text-white/40 text-sm mb-5">
              Configure your timezone and booking rules.
            </p>

            <div className="space-y-4">
              {/* 🔑 Plan limits (read-only — comes from subscription plan) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheckIcon className="h-4 w-4 text-cyan-400" />
                  <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-semibold">
                    {salon?.subscriptionLevel || "Plan"} limits
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                      Services
                    </p>
                    <p className="text-lg font-bold text-white">
                      {salon?.maxServices == null
                        ? "—"
                        : salon.maxServices === 0
                        ? "Unlimited"
                        : salon.maxServices}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
                      Bookings / month
                    </p>
                    <p className="text-lg font-bold text-white">
                      {salon?.maxBookingsPerMonth == null
                        ? "—"
                        : salon.maxBookingsPerMonth === 0
                        ? "Unlimited"
                        : salon.maxBookingsPerMonth}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-white/40 mt-3">
                  These limits come from your subscription plan.{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/subscription")}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Upgrade to increase →
                  </button>
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className={labelClass}>Time zone</label>
                <select
                  value={billingForm.timezone}
                  onChange={(e) =>
                    setBillingForm({ ...billingForm, timezone: e.target.value })
                  }
                  disabled={!editingBilling}
                  className={selectClass}
                >
                  <option value="Europe/London" className="bg-slate-900 text-white">GMT (London)</option>
                  <option value="Europe/Paris" className="bg-slate-900 text-white">CET (Paris)</option>
                  <option value="America/New_York" className="bg-slate-900 text-white">EST (New York)</option>
                  <option value="America/Los_Angeles" className="bg-slate-900 text-white">PST (Los Angeles)</option>
                  <option value="Asia/Dubai" className="bg-slate-900 text-white">GST (Dubai)</option>
                  <option value="Asia/Tokyo" className="bg-slate-900 text-white">JST (Tokyo)</option>
                  <option value="Australia/Sydney" className="bg-slate-900 text-white">AEDT (Sydney)</option>
                </select>
              </div>

              {/* Currency (locked to GBP) */}
              <div>
                <label className={labelClass}>Currency</label>
                <input
                  type="text"
                  value="GBP (£)"
                  disabled
                  className={`${inputClass} cursor-not-allowed`}
                />
                <p className="text-white/25 text-xs mt-1">
                  KrownBraids currently operates in the UK only
                </p>
              </div>

              {/* Cancellation policy */}
              <div>
                <label className={labelClass}>Cancellation policy</label>
                <textarea
                  value={billingForm.cancellationPolicy}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      cancellationPolicy: e.target.value,
                    })
                  }
                  disabled={!editingBilling}
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="24 hours notice required for full refund"
                />
              </div>

              {/* Terms */}
              <div>
                <label className={labelClass}>Terms & conditions</label>
                <textarea
                  value={billingForm.termsAndConditions}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      termsAndConditions: e.target.value,
                    })
                  }
                  disabled={!editingBilling}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Your salon's terms and conditions…"
                />
              </div>

              {/* Privacy */}
              <div>
                <label className={labelClass}>Privacy policy</label>
                <textarea
                  value={billingForm.privacyPolicy}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      privacyPolicy: e.target.value,
                    })
                  }
                  disabled={!editingBilling}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Your salon's privacy policy…"
                />
              </div>
            </div>
          </div>

          {editingBilling && <SaveButton saving={saving} label="Save business settings" />}
        </form>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Save button                                                        */
/* ------------------------------------------------------------------ */

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3.5 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="relative z-10">{saving ? "Saving…" : label}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}