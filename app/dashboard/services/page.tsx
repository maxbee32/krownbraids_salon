// app/dashboard/services/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useServiceContext } from '@/app/context/ServiceContext';

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyPoundIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Service {
  id: string;
  salonId: string;
  name: string;
  description: string;
  amount: number;
  durationMinutes: number;
  category: string;
  isActive: boolean;
  termsAndConditions: string;
  tags: string[];
  availability: string;
  isFeatured: boolean;
  requiresBooking: boolean;
  quantity: number;
  serviceImages: string[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface ServiceFormData {
  name: string;
  description: string;
  amount: number | string;
  durationMinutes: number;
  category: string;
  isActive: boolean;
  termsAndConditions: string;
  tags: string;
  availability: string;
  isFeatured: boolean;
  requiresBooking: boolean;
  images: File[];
}

interface SalonData {
  id: number;
  name: string;
  email: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  const router = useRouter();
  const { incrementServiceCount, decrementServiceCount } = useServiceContext();

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'durationMinutes' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    amount: '',
    durationMinutes: 30,
    category: '',
    isActive: true,
    termsAndConditions: '',
    tags: '',
    availability: 'Available',
    isFeatured: false,
    requiresBooking: true,
    images: [],
  });

  /* ---------- Helpers ---------- */

  const fetchImageWithHeader = async (url: string): Promise<string> => {
    try {
      if (!url.includes('ngrok-free.app')) return url;
      const response = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!response.ok) return url;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return url;
    }
  };

  const loadServiceImages = async (service: Service): Promise<Service> => {
    if (service.serviceImages && service.serviceImages.length > 0) {
      const loaded = await Promise.all(
        service.serviceImages.map(fetchImageWithHeader)
      );
      return { ...service, serviceImages: loaded };
    }
    return service;
  };

  useEffect(() => {
    return () => {
      imagePreview.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreview]);

  /**
   * When the session is about to expire, close any open modal or transient
   * UI so the session expiry warning gets the user's full attention.
   */
  useEffect(() => {
    const handler = () => {
      setShowModal(false);
      setShowDeleteConfirm(null);
      setSuccessMessage(null);
      setError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  useEffect(() => {
    fetchSalonAndServices();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let result = [...services];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.category.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'active') result = result.filter((s) => s.isActive);
    else if (filterStatus === 'inactive') result = result.filter((s) => !s.isActive);

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'durationMinutes':
          comparison = a.durationMinutes - b.durationMinutes;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredServices(result);
  }, [services, searchTerm, filterStatus, sortBy, sortOrder]);

  /* ---------- Fetch ---------- */

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const response = await fetch('/api/auth/categories?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setCategories(await response.json());
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSalonAndServices = async () => {
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

      const detailsResponse = await fetch(`/api/auth/business/salons/${salonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        setSalon(details.data || details);
      }

      const servicesResponse = await fetch(`/api/auth/services?salonId=${salonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const list = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
        const withImages = await Promise.all(list.map(loadServiceImages));
        setServices(withImages);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Modal / form ---------- */

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        amount: service.amount,
        durationMinutes: service.durationMinutes,
        category: service.category || '',
        isActive: service.isActive,
        termsAndConditions: service.termsAndConditions || '',
        tags: service.tags ? service.tags.join(', ') : '',
        availability: service.availability || 'Available',
        isFeatured: service.isFeatured || false,
        requiresBooking: service.requiresBooking !== undefined ? service.requiresBooking : true,
        images: [],
      });
      setImagePreview(service.serviceImages || []);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        amount: '',
        durationMinutes: 30,
        category: '',
        isActive: true,
        termsAndConditions: '',
        tags: '',
        availability: 'Available',
        isFeatured: false,
        requiresBooking: true,
        images: [],
      });
      setImagePreview([]);
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setError(null);
    setImagePreview([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const arr = Array.from(files);
      setFormData({ ...formData, images: [...formData.images, ...arr] });
      setImagePreview([...imagePreview, ...arr.map((f) => URL.createObjectURL(f))]);
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');
      const salonId = salon?.id;
      if (!salonId) throw new Error('Salon not found');

      const hasImages = formData.images && formData.images.length > 0;

      const serviceData = {
        name: formData.name,
        description: formData.description || '',
        category: formData.category,
        amount:
          typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        durationMinutes: formData.durationMinutes,
        isActive: formData.isActive,
        termsAndConditions: formData.termsAndConditions || '',
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        availability: formData.availability || 'Available',
        isFeatured: formData.isFeatured,
        requiresBooking: formData.requiresBooking,
        quantity: 1,
      };

      let url: string;
      const method = editingService ? 'PUT' : 'POST';
      if (editingService) {
        url = hasImages
          ? `/api/auth/services/${editingService.id}/with-images`
          : `/api/auth/services/${editingService.id}`;
      } else {
        url = hasImages
          ? `/api/auth/services/with-images?salonId=${salonId}`
          : `/api/auth/services?salonId=${salonId}`;
      }

      let body: any;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      if (hasImages) {
        const fd = new FormData();
        fd.append(
          'service',
          new Blob([JSON.stringify(serviceData)], { type: 'application/json' }),
          'service.json'
        );
        formData.images.forEach((img) => fd.append('images', img));
        body = fd;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(serviceData);
      }

      const response = await fetch(url, { method, headers, body });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to save service');

      const saved = responseData.data || responseData;
      if (editingService) {
        setServices(services.map((s) => (s.id === saved.id ? saved : s)));
        setSuccessMessage('Service updated.');
      } else {
        setServices([saved, ...services]);
        incrementServiceCount();
        setSuccessMessage('Service created.');
      }

      handleCloseModal();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      if (!serviceId) return;
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/auth/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to delete service');

      setServices(services.filter((s) => s.id !== serviceId));
      decrementServiceCount();
      setShowDeleteConfirm(null);
      setSuccessMessage('Service deleted.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleToggleStatus = async (serviceId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/auth/services/${serviceId}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      let responseData;
      if (contentType?.includes('application/json')) responseData = await response.json();
      else throw new Error('Server returned an error');

      if (!response.ok) throw new Error(responseData.message || 'Failed to toggle');

      const updated = responseData.data || responseData;
      setServices(services.map((s) => (s.id === updated.id ? updated : s)));
      setSuccessMessage(`Service ${updated.isActive ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Toggle error:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle service');
    }
  };

  /* ---------- Formatters ---------- */

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-cyan-400 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">Loading services</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Services
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {salon?.name
              ? `Manage the services offered by ${salon.name}.`
              : 'Manage your salon services.'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="self-start sm:self-auto relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add service
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
      {error && !showModal && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/60 hover:text-red-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{services.length}</p>
          <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">
            Total services
          </p>
        </div>
        <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">
            {services.filter((s) => s.isActive).length}
          </p>
          <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">Active</p>
        </div>
        <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white/40">
            {services.filter((s) => !s.isActive).length}
          </p>
          <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">Inactive</p>
        </div>
        <div className="backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-cyan-400">
            {services.length > 0
              ? formatCurrency(
                  services.reduce((sum, s) => sum + s.amount, 0) / services.length
                )
              : '£0'}
          </p>
          <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">
            Average price
          </p>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search services by name, description, or category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
            showFilters
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-300'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60'
          }`}
          aria-label="Filters"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
              >
                <option value="all">All services</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">Sort by</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                >
                  <option value="name">Name</option>
                  <option value="amount">Price</option>
                  <option value="durationMinutes">Duration</option>
                  <option value="createdAt">Date added</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  aria-label="Toggle sort order"
                >
                  {sortOrder === 'asc' ? (
                    <ChevronUpIcon className="h-4 w-4 text-white/60" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-white/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-white/10 sm:border-t-0 sm:self-end">
              <span className="text-sm text-white/40">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <ArrowPathIcon className="h-3 w-3" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services grid */}
      {filteredServices.length === 0 ? (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
              <TagIcon className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? 'No matching services' : 'No services yet'}
          </h3>
          <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
            {searchTerm
              ? 'Try a different search term or clear the filters.'
              : 'Add your first service to start taking bookings.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Add your first service
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              showDeleteConfirm={showDeleteConfirm}
              onEdit={() => handleOpenModal(service)}
              onToggle={() => handleToggleStatus(service.id)}
              onDeleteRequest={() => setShowDeleteConfirm(service.id)}
              onDeleteCancel={() => setShowDeleteConfirm(null)}
              onDeleteConfirm={() => handleDelete(service.id)}
              formatCurrency={formatCurrency}
              formatDuration={formatDuration}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ServiceModal
          editingService={editingService}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          imagePreview={imagePreview}
          error={error}
          isSubmitting={isSubmitting}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Service card                                                       */
/* ------------------------------------------------------------------ */

function ServiceCard({
  service,
  showDeleteConfirm,
  onEdit,
  onToggle,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  formatCurrency,
  formatDuration,
  formatDate,
}: {
  service: Service;
  showDeleteConfirm: string | null;
  onEdit: () => void;
  onToggle: () => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n: number) => string;
  formatDate: (s: string) => string;
}) {
  return (
    <div className="group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/20 transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm md:text-base truncate">
              {service.name}
            </h3>
            {service.category && (
              <span className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-full inline-block mt-1 max-w-full truncate">
                {service.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              title={service.isActive ? 'Deactivate' : 'Activate'}
            >
              {service.isActive ? (
                <EyeIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
              ) : (
                <EyeSlashIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/30" />
              )}
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              title="Edit"
            >
              <PencilIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-cyan-400" />
            </button>
            <button
              onClick={onDeleteRequest}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Images */}
        {service.serviceImages && service.serviceImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 mb-3">
            {service.serviceImages.slice(0, 3).map((img, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-cyan-500/5 border border-white/5">
                <img
                  src={img}
                  alt={`${service.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
            {service.serviceImages.length > 3 && (
              <div className="aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/40">
                +{service.serviceImages.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mb-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center"
              >
                <PhotoIcon className="h-6 w-6 text-white/15" />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {service.description && (
          <p className="text-white/40 text-xs md:text-sm mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CurrencyPoundIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-cyan-400 flex-shrink-0" />
            <span className="text-white font-medium text-sm md:text-base">
              {formatCurrency(service.amount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-cyan-400 flex-shrink-0" />
            <span className="text-white/60 text-xs md:text-sm">
              {formatDuration(service.durationMinutes)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              service.isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            {service.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-white/25 text-[10px] md:text-xs">
            {formatDate(service.createdAt)}
          </span>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm === service.id && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <p className="text-sm text-white/70 mb-3 truncate">
              Delete &quot;{service.name}&quot;?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onDeleteCancel}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onDeleteConfirm}
                className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 py-1.5 rounded-lg text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Service modal                                                      */
/* ------------------------------------------------------------------ */

function ServiceModal({
  editingService,
  formData,
  setFormData,
  categories,
  imagePreview,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  onImageChange,
  onRemoveImage,
}: {
  editingService: Service | null;
  formData: ServiceFormData;
  setFormData: (d: ServiceFormData) => void;
  categories: Category[];
  imagePreview: string[];
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (i: number) => void;
}) {
  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all';
  const labelClass = 'block text-white/60 text-sm font-medium mb-1';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="sticky top-0 backdrop-blur-2xl bg-slate-900/80 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-white">
            {editingService ? 'Edit service' : 'Add service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Service name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
              placeholder="e.g. Knotless braids"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe what's included…"
            />
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Price (£) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={inputClass}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Duration (mins) *</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })
                }
                className={inputClass}
                required
                min="5"
                step="5"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`${inputClass} [color-scheme:dark]`}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className={inputClass}
              placeholder="e.g. Premium, Express, Bridal"
            />
          </div>

          {/* T&Cs */}
          <div>
            <label className={labelClass}>Terms & conditions</label>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="e.g. 48-hour cancellation policy"
            />
          </div>

          {/* Availability */}
          <div>
            <label className={labelClass}>Availability</label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className={`${inputClass} [color-scheme:dark]`}
            >
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
              <option value="Booked">Booked</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <CheckboxRow
              label="Featured"
              checked={formData.isFeatured}
              onChange={(v) => setFormData({ ...formData, isFeatured: v })}
            />
            <CheckboxRow
              label="Requires booking"
              checked={formData.requiresBooking}
              onChange={(v) => setFormData({ ...formData, requiresBooking: v })}
            />
            <CheckboxRow
              label="Active"
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
            />
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>Service images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {imagePreview.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-white/15 hover:border-cyan-400/50 flex items-center justify-center cursor-pointer transition-colors">
                <PhotoIcon className="h-6 w-6 text-white/30" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-white/25 text-xs">Upload up to 5 images</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60"
            >
              <span className="relative z-10">
                {isSubmitting ? 'Saving…' : editingService ? 'Update service' : 'Create service'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded bg-white/5 border-white/20 text-cyan-500 focus:ring-cyan-500/20"
      />
      <span className="text-white/70 text-sm">{label}</span>
    </label>
  );
}