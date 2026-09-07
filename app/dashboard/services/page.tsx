// app/dashboard/services/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useServiceContext } from '@/app/context/ServiceContext';

import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  CurrencyPoundIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PhotoIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

// Types
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

export default function ServicesPage() {
  const router = useRouter();
  // ✅ Get context functions
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

  // Form state
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

  // Fetch salon, services, and categories on mount
  useEffect(() => {
    fetchSalonAndServices();
    fetchCategories();
  }, []);

  // Filter and sort services whenever dependencies change
  useEffect(() => {
    let result = [...services];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'active') {
      result = result.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(s => !s.isActive);
    }

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
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredServices(result);
  }, [services, searchTerm, filterStatus, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch("/api/auth/categories?active=true", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSalonAndServices = async () => {
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
        setSalon(details.data || details);
      }

      const servicesResponse = await fetch(`/api/auth/services?salonId=${salonId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const serviceList = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
        setServices(serviceList);
      } else {
        const errorData = await servicesResponse.json();
        console.error("Services API error:", errorData);
        setServices([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

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
      const fileArray = Array.from(files);
      setFormData({ ...formData, images: [...formData.images, ...fileArray] });
      
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreview([...imagePreview, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
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
        description: formData.description || "",
        category: formData.category,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        durationMinutes: formData.durationMinutes,
        isActive: formData.isActive,
        termsAndConditions: formData.termsAndConditions || "",
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        availability: formData.availability || "Available",
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
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (hasImages) {
        const formDataToSend = new FormData();
        
        const serviceBlob = new Blob([JSON.stringify(serviceData)], {
          type: 'application/json'
        });
        formDataToSend.append("service", serviceBlob, "service.json");
        
        formData.images.forEach((image) => {
          formDataToSend.append("images", image);
        });

        body = formDataToSend;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(serviceData);
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save service');
      }

      const savedService = responseData.data || responseData;
      
      if (editingService) {
        setServices(services.map(s => s.id === savedService.id ? savedService : s));
        setSuccessMessage('Service updated successfully!');
      } else {
        setServices([savedService, ...services]);
        // ✅ Increment the service count on dashboard
        incrementServiceCount();
        setSuccessMessage('Service created successfully!');
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
      if (!serviceId || serviceId === 'undefined' || serviceId === '') {
        console.error("❌ Invalid service ID:", serviceId);
        setError('Cannot delete: Invalid service ID');
        return;
      }

      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/auth/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete service');
      }

      setServices(services.filter(s => s.id !== serviceId));
      // ✅ Decrement the service count on dashboard
      decrementServiceCount();
      setShowDeleteConfirm(null);
      setSuccessMessage('Service deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const handleToggleStatus = async (serviceId: string) => {
    try {
      if (!serviceId || serviceId === 'undefined' || serviceId === '') {
        console.error("❌ Invalid service ID:", serviceId);
        setError('Cannot toggle: Invalid service ID');
        return;
      }

      console.log("🔄 Toggling status for service:", serviceId);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/auth/services/${serviceId}/toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error('Server returned an error');
      }

      console.log("Toggle response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to toggle service status');
      }

      const updatedService = responseData.data || responseData;
      setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
      setSuccessMessage(`Service ${updatedService.isActive ? 'activated' : 'deactivated'}!`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      console.error('Toggle error:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle service status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500 mx-auto" />
          <p className="text-white/50 mt-4 text-sm">Loading services...</p>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl hover:bg-white/10 transition-all flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white/60" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">Services</h1>
                <p className="text-white/40 text-xs md:text-sm truncate">
                  {salon?.name ? `${salon.name}` : 'Manage your services'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Add Service</span>
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 animate-fade-in">
              <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm truncate">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm truncate">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400/60 hover:text-red-400 flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search services..."
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

          {/* Filters */}
          {showFilters && (
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-white/10 mb-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-white/40 text-xs block mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="all">All Services</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-white/40 text-xs block mb-1">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="name">Name</option>
                      <option value="amount">Price</option>
                      <option value="durationMinutes">Duration</option>
                      <option value="createdAt">Date</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      {sortOrder === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4 text-white/60" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-white/10 sm:border-t-0">
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
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/10 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-purple-500/10">
                  <TagIcon className="h-10 w-10 md:h-12 md:w-12 text-purple-400" />
                </div>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">
                {searchTerm ? 'No matching services' : 'No Services Yet'}
              </h3>
              <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search or filters'
                  : 'Start adding your salon services to attract clients'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Add Your First Service
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white/5 backdrop-blur-2xl rounded-2xl p-4 md:p-5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm md:text-base truncate">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full inline-block mt-1 max-w-full truncate">
                          {service.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleStatus(service.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                        title={service.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {service.isActive ? (
                          <EyeIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-400" />
                        ) : (
                          <EyeSlashIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white/30" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <PencilIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(service.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <TrashIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Images */}
                  {service.serviceImages && service.serviceImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      {service.serviceImages.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-purple-500/10">
                          <img 
                            src={img} 
                            alt={`${service.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-full h-full flex items-center justify-center';
                                placeholder.innerHTML = `<svg class="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      ))}
                      {service.serviceImages.length > 3 && (
                        <div className="aspect-square rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40">
                          +{service.serviceImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {(!service.serviceImages || service.serviceImages.length === 0) && (
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx} className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 text-white/20" />
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
                    <div className="flex items-center gap-2 text-sm">
                      <CurrencyPoundIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-white font-medium text-sm md:text-base">
                        {formatCurrency(service.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-400 flex-shrink-0" />
                      <span className="text-white/60 text-xs md:text-sm">
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      service.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 text-white/30'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-white/20 text-[10px] md:text-xs">
                      {formatDate(service.createdAt)}
                    </span>
                  </div>

                  {/* Delete Confirm */}
                  {showDeleteConfirm === service.id && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-sm text-white/60 mb-3 truncate">
                        Delete &quot;{service.name}&quot;?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 bg-white/10 py-1.5 rounded-lg text-sm hover:bg-white/20 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="flex-1 bg-red-500/20 text-red-400 py-1.5 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
              >
                <XMarkIcon className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                  placeholder="e.g., Hair Styling"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  rows={3}
                  placeholder="Describe your service..."
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-1">
                    Duration (mins) *
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                    min="5"
                    step="5"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="e.g., Premium, Express, Luxury"
                />
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  rows={2}
                  placeholder="Terms and conditions for this service..."
                />
              </div>

              {/* Availability */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Availability
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Booked">Booked</option>
                </select>
              </div>

              {/* Featured & Requires Booking */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500/20"
                  />
                  <label className="text-white/60 text-sm">Featured</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.requiresBooking}
                    onChange={(e) => setFormData({ ...formData, requiresBooking: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500/20"
                  />
                  <label className="text-white/60 text-sm">Requires Booking</label>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500/20"
                />
                <label className="text-white/60 text-sm">
                  Active (visible to clients)
                </label>
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-white/60 text-sm font-medium mb-1">
                  Service Images
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors">
                    <PhotoIcon className="h-6 w-6 text-white/30" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-white/20 text-xs">Upload up to 5 images</p>
              </div>

              {/* Error in modal */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-white/10 py-2.5 rounded-xl text-white/60 text-sm hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 rounded-xl text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
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