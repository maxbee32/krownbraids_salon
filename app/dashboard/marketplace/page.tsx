// app/dashboard/marketplace/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ShoppingBagIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
  ChevronDownIcon,
  TruckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

/* ------------------------------------------------------------------ */
/*  Stripe singleton                                                   */
/* ------------------------------------------------------------------ */

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  imageUrl: string;
  status: string;
  createdAt: string;
  estimatedDeliveryDays?: number | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

interface CheckoutSession {
  clientSecret: string;
  sessionId: string;
  orderId: number;
  orderNumber: string;
  total: number;
  currency: string;
}

interface AddressOption {
  line_1: string;
  line_2: string;
  post_town: string;
  postcode: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc", label: "A–Z" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

const proxyImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("/api/uploads/")) return url;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("data:")) return url;

  const suppliersIdx = url.indexOf("/images/suppliers/");
  if (suppliersIdx !== -1) {
    const rest = url.substring(suppliersIdx + "/images/suppliers/".length);
    const clean = rest.startsWith("products/")
      ? rest.slice("products/".length)
      : rest;
    return `/api/uploads/${clean}`;
  }

  const uploadsProductsIdx = url.indexOf("/uploads/products/");
  if (uploadsProductsIdx !== -1) {
    return `/api/uploads/${url.substring(
      uploadsProductsIdx + "/uploads/products/".length
    )}`;
  }

  if (url.startsWith("/uploads/")) return `/api${url}`;
  if (url.startsWith("uploads/")) return `/api/${url}`;

  const bareMatch = url.match(
    /^\/?([a-zA-Z0-9_-]+)\/([^/]+\.(?:jpe?g|png|webp|gif|avif|svg))$/i
  );
  if (bareMatch) {
    return `/api/uploads/${bareMatch[1]}/${bareMatch[2]}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  return url;
};

function deliveryLabel(days: number | null | undefined): string | null {
  if (days == null) return null;
  if (days <= 0) return "Ships same day";
  if (days === 1) return "Ships next day";
  return `Ships in ${days} days`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // ── Checkout flow state ──────────────────────────────────────
  const [shippingOpen, setShippingOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingAddress>({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "United Kingdom",
    notes: "",
  });

  /* ---------- Load products ---------- */
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const res = await fetch("/api/auth/marketplace/products", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
        const json = await res.json();
        const raw = Array.isArray(json) ? json : json.data || [];
        const mapped: Product[] = raw.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          category: p.category || "",
          price: Number(p.price) || 0,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          stockQuantity: p.stockQuantity ?? 0,
          lowStockThreshold: p.lowStockThreshold,
          imageUrl: proxyImageUrl(p.imageUrl),
          status: p.status || "ACTIVE",
          createdAt: p.createdAt || "",
          estimatedDeliveryDays: p.estimatedDeliveryDays ?? null,
        }));
        setProducts(mapped);
      } catch (err) {
        console.error("Error loading products:", err);
        setProductsError(err instanceof Error ? err.message : "Failed to load products");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  /* ---------- Load categories ---------- */
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const res = await fetch("/api/auth/cat", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const json = await res.json();
        const raw: Category[] = Array.isArray(json) ? json : json.data || [];
        const sorted = [...raw].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(sorted);
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategoriesError(err instanceof Error ? err.message : "Failed to load categories");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  /* ---------- Persist cart ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("salonCart");
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("salonCart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handler = () => {
      setSelectedProduct(null);
      setCartOpen(false);
      setShippingOpen(false);
      setCheckoutSession(null);
      setShowSuccess(null);
      setProductsError(null);
      setCategoriesError(null);
      setCheckoutError(null);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  /* ---------- Cart actions ---------- */
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    setCartPulseKey((k) => k + 1);

    setJustAdded(product.id);
    setTimeout(() => setJustAdded(null), 1200);

    setShowSuccess(`${product.name} added to cart`);
    setTimeout(() => setShowSuccess(null), 2000);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("newest");
    setPriceRange([0, 500]);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    priceRange[1] < 500;

  /* ---------- Checkout ---------- */
  const openShippingModal = () => {
    setCheckoutError(null);
    setShippingOpen(true);
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("You are not signed in.");

      const onboardingRes = await fetch("/api/auth/business/salons/onboarding", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!onboardingRes.ok) throw new Error("Could not load your salon.");
      const onboarding = await onboardingRes.json();
      const salonId = onboarding.salonId ?? onboarding.id;
      if (!salonId) throw new Error("Salon not found.");

      const res = await fetch("/api/auth/marketplace/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salonId,
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
          })),
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingPostalCode: shipping.postalCode,
          shippingCountry: shipping.country,
          shippingNotes: shipping.notes || null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error || json.message || "Checkout could not be started."
        );
      }
      if (!json.clientSecret) {
        throw new Error("No payment session returned.");
      }

      setShippingOpen(false);
      setCheckoutSession({
        clientSecret: json.clientSecret,
        sessionId: json.sessionId,
        orderId: json.orderId,
        orderNumber: json.orderNumber,
        total: Number(json.total),
        currency: json.currency ?? "GBP",
      });
    } catch (err: any) {
      setCheckoutError(err.message ?? "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.08] via-purple-500/[0.05] to-transparent p-6 md:p-8 mb-8">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Wholesale marketplace
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              Everything your salon needs
            </h1>
            <p className="text-white/50 text-sm mt-2 max-w-xl">
              Trade prices from vetted UK wholesalers. Order hair, tools, and stock
              in one place — delivered to your salon.
            </p>
          </div>

          <button
            key={cartPulseKey}
            onClick={() => setCartOpen(true)}
            className={`self-start md:self-auto relative inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden flex-shrink-0 ${
              cartPulseKey > 0 ? "animate-[pulse_0.4s_ease-in-out]" : ""
            }`}
          >
            <span className="relative z-10 flex items-center gap-2.5">
              <ShoppingBagIcon className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-white/25 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {cartCount}
                </span>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {(categoriesError || productsError) && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-amber-200 text-sm font-medium">
              {productsError ? "Couldn't load products" : "Couldn't load categories"}
            </p>
            <p className="text-amber-300/60 text-xs mt-0.5">
              {productsError
                ? "Check your connection and try again."
                : "Showing all products — categories unavailable."}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-amber-300 hover:text-amber-200 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {showSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-in fade-in"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-emerald-200 text-sm">{showSuccess}</p>
        </div>
      )}

      {/* SEARCH + FILTERS */}
      <div className="sticky top-16 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 bg-slate-900/70 backdrop-blur-xl border-y border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative group">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Search products, brands, or categories…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-3.5 w-3.5 text-white/40" />
              </button>
            )}
          </div>

          <div className="hidden sm:block relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark] cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-300"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
            }`}
            aria-label="Filters"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && !showFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                    Max price
                  </label>
                  <span className="text-cyan-300 text-sm font-semibold tabular-nums">
                    {formatCurrency(priceRange[1])}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="sm:hidden">
                <label className="text-white/50 text-[11px] uppercase tracking-wider font-semibold block mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium px-3 py-2 rounded-lg hover:bg-cyan-500/10"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY CHIPS */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {categoriesLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 rounded-xl bg-white/5 border border-white/10 animate-pulse flex-shrink-0"
                />
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40 shadow-lg shadow-cyan-500/10"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10 hover:text-white"
                }`}
              >
                All products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  title={cat.description}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === cat.name
                      ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40 shadow-lg shadow-cyan-500/10"
                      : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* RESULTS HEADER */}
      {!productsLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-sm">
            <span className="text-white/80 font-semibold">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "product" : "products"}
            {selectedCategory !== "all" && (
              <>
                {" "}in{" "}
                <span className="text-cyan-300 font-medium">{selectedCategory}</span>
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-white/40 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* PRODUCT GRID */}
      {productsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/5] bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-4 w-3/4 bg-white/5 rounded" />
                <div className="h-5 w-20 bg-white/5 rounded" />
                <div className="h-9 w-full bg-white/5 rounded-lg mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-16 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="flex justify-center mb-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
              <ShoppingBagIcon className="h-10 w-10 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {hasActiveFilters ? "No products match your filters" : "No products available"}
          </h3>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? "Try adjusting your search or filters to see more results."
              : "New products are being added regularly. Check back soon."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => addToCart(product)}
              onView={() => setSelectedProduct(product)}
              justAdded={justAdded === product.id}
            />
          ))}
        </div>
      )}

      <div className="h-12" />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        subtotal={cartSubtotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        onProceed={openShippingModal}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(qty) => {
            addToCart(selectedProduct, qty);
            setSelectedProduct(null);
          }}
        />
      )}

      {shippingOpen && (
        <ShippingModal
          shipping={shipping}
          onChange={setShipping}
          onSubmit={startCheckout}
          onClose={() => setShippingOpen(false)}
          loading={checkoutLoading}
          error={checkoutError}
          total={cartSubtotal}
        />
      )}

      {checkoutSession && (
        <MarketplaceCheckoutModal
          session={checkoutSession}
          onClose={() => setCheckoutSession(null)}
          onComplete={() => {
            setCart([]);
            setCheckoutSession(null);
            setShowSuccess("Order placed successfully. Check your email.");
            setTimeout(() => setShowSuccess(null), 6000);
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card                                                       */
/* ------------------------------------------------------------------ */

function ProductCard({
  product,
  onAdd,
  onView,
  justAdded,
}: {
  product: Product;
  onAdd: () => void;
  onView: () => void;
  justAdded?: boolean;
}) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : 0;

  const isLowStock = product.stockQuantity < 30 && product.stockQuantity > 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const delivery = deliveryLabel(product.estimatedDeliveryDays);

  return (
    <div
      className={`group relative bg-white/[0.03] rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
        justAdded
          ? "border-emerald-400/60 ring-2 ring-emerald-400/30 bg-emerald-500/[0.06]"
          : "border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.05]"
      }`}
    >
      <button
        onClick={onView}
        className="relative aspect-[4/5] overflow-hidden bg-slate-800/50"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-16 w-16 text-white/10" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-md shadow-lg">
              −{discount}%
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-bold bg-slate-900/90 backdrop-blur text-white px-2 py-0.5 rounded-md">
              SOLD OUT
            </span>
          )}
        </div>

        {isLowStock && !isOutOfStock && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-lg">
              {product.stockQuantity} left
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-medium text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
            Quick view
          </span>
        </div>
      </button>

      <div className="p-4 flex-1 flex flex-col">
        {product.category && (
          <p className="text-[10px] uppercase tracking-[0.1em] text-cyan-400/80 font-semibold mb-1">
            {product.category}
          </p>
        )}

        <button onClick={onView} className="text-left group/title">
          <h3 className="text-sm md:text-[15px] font-semibold text-white line-clamp-2 leading-snug group-hover/title:text-cyan-300 transition-colors">
            {product.name}
          </h3>
        </button>
                {product.description && (
          <p className="text-xs text-white/40 mt-1 line-clamp-1">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-white tabular-nums">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-white/30 line-through tabular-nums">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {delivery && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/40">
            <TruckIcon className="h-3 w-3 flex-shrink-0" />
            <span>{delivery}</span>
          </div>
        )}

        <p className="mt-1 text-[10px] text-white/25">
          Trade price · verified supplier
        </p>

        <div className="mt-4 flex-1 flex items-end">
          <button
            onClick={onAdd}
            disabled={isOutOfStock}
            className={`relative w-full rounded-lg py-2.5 text-xs font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group/btn overflow-hidden border ${
              justAdded
                ? "bg-emerald-500 border-emerald-400"
                : "bg-white/[0.06] hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-500 border-white/[0.08] hover:border-transparent"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {justAdded ? (
                <>
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                <>
                  <PlusIcon className="h-3.5 w-3.5" />
                  {isOutOfStock ? "Out of stock" : "Add to cart"}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cart drawer                                                        */
/* ------------------------------------------------------------------ */

function CartDrawer({
  open,
  onClose,
  cart,
  subtotal,
  onUpdateQuantity,
  onRemove,
  onClear,
  onProceed,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onProceed: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end md:pl-72">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <ShoppingBagIcon className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Your cart</h2>
              {itemCount > 0 && (
                <p className="text-white/40 text-xs">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close cart"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
                <ShoppingBagIcon className="h-7 w-7 text-cyan-400/60" />
              </div>
              <p className="text-white/70 text-sm font-medium mb-1">Your cart is empty</p>
              <p className="text-white/40 text-xs max-w-[200px] mx-auto">
                Add products from the marketplace to get started.
              </p>
              <button
                onClick={onClose}
                className="mt-5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
              >
                Browse products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <div className="w-[72px] h-[72px] rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 truncate">
                        {item.product.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1.5 hover:bg-white/10 transition-colors"
                          aria-label="Decrease"
                        >
                          <MinusIcon className="h-3 w-3 text-white/70" />
                        </button>
                        <span className="text-xs font-semibold text-white px-2.5 min-w-[28px] text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1.5 hover:bg-white/10 transition-colors"
                          aria-label="Increase"
                        >
                          <PlusIcon className="h-3 w-3 text-white/70" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white tabular-nums">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => onRemove(item.product.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                          aria-label="Remove"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length > 1 && (
                <button
                  onClick={onClear}
                  className="w-full text-xs text-white/40 hover:text-red-300 transition-colors text-center py-2.5 rounded-lg hover:bg-red-500/5"
                >
                  Clear all items
                </button>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/[0.06] p-5 space-y-4 bg-white/[0.02]">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-medium tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">VAT</span>
                <span className="text-white/40 text-xs">Included</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Delivery</span>
                <span className="text-white/40 text-xs">At checkout</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-xl font-bold text-white tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <button
              onClick={onProceed}
              className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10">Proceed to checkout</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <p className="text-[10px] text-white/30 text-center">
              Secure checkout · UK delivery
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Product detail modal                                               */
/* ------------------------------------------------------------------ */

function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : 0;

  const isOutOfStock = product.stockQuantity <= 0;
  const delivery = deliveryLabel(product.estimatedDeliveryDays);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-white/10 w-full max-w-4xl my-0 sm:my-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur transition-all"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5 text-white/70" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-square bg-slate-800">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PhotoIcon className="h-20 w-20 text-white/10" />
              </div>
            )}

            {discount > 0 && (
              <span className="absolute top-4 left-4 text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-md shadow-lg">
                −{discount}% OFF
              </span>
            )}
          </div>

          <div className="flex flex-col p-6 md:p-8">
            {product.category && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400/80 font-semibold mb-2">
                {product.category}
              </p>
            )}

            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-white tabular-nums">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-white/30 line-through tabular-nums">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-white/60 mt-5 leading-relaxed">
                {product.description}
              </p>
            )}

            {delivery && (
              <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <TruckIcon className="h-4 w-4 text-white/40" />
                <span>{delivery}</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  isOutOfStock
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : product.stockQuantity < 30
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOutOfStock ? "bg-red-400" : product.stockQuantity < 30 ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                {isOutOfStock
                  ? "Out of stock"
                  : `${product.stockQuantity} in stock`}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-white/30">
              Trade price · verified supplier
            </p>

            <div className="mt-auto pt-6 flex items-center gap-3">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white/10 transition-colors"
                  aria-label="Decrease"
                  disabled={isOutOfStock}
                >
                  <MinusIcon className="h-4 w-4 text-white/70" />
                </button>
                <span className="text-sm font-semibold text-white px-3 min-w-[40px] text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-white/10 transition-colors"
                  aria-label="Increase"
                  disabled={isOutOfStock}
                >
                  <PlusIcon className="h-4 w-4 text-white/70" />
                </button>
              </div>

              <button
                onClick={() => onAdd(quantity)}
                disabled={isOutOfStock}
                className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  {isOutOfStock ? "Out of stock" : `Add ${quantity} to cart`}
                </span>
                {!isOutOfStock && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Shipping modal — includes postcode → address lookup                */
/* ------------------------------------------------------------------ */

function ShippingModal({
  shipping,
  onChange,
  onSubmit,
  onClose,
  loading,
  error,
  total,
}: {
  shipping: ShippingAddress;
  onChange: (s: ShippingAddress) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  total: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  if (!mounted) return null;

  const update = (key: keyof ShippingAddress, value: string) =>
    onChange({ ...shipping, [key]: value });

  const canSubmit = Boolean(
    shipping.name.trim() &&
      shipping.phone.trim() &&
      shipping.address.trim() &&
      shipping.city.trim() &&
      shipping.postalCode.trim() &&
      shipping.country.trim()
  );

  return createPortal(
    <div
      className="
        fixed inset-0 z-[200]
        flex items-end sm:items-center justify-center
        p-0 sm:p-4 md:pl-72
        bg-black/70 backdrop-blur-md
        overflow-y-auto
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipping-modal-title"
    >
      <div
        className="
          relative bg-slate-900 border border-white/10
          rounded-t-3xl sm:rounded-2xl
          w-full max-w-lg
          my-0 sm:my-8
          shadow-2xl shadow-black/50
          overflow-hidden
          flex flex-col
          max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)]
        "
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-0.5 sm:mb-1">
              Shipping
            </p>
            <h2
              id="shipping-modal-title"
              className="text-sm sm:text-base font-semibold text-white truncate"
            >
              Where should we deliver?
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40 flex-shrink-0"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <Field
            label="Full name"
            value={shipping.name}
            onChange={(v) => update("name", v)}
            placeholder="e.g. Jane Doe"
            disabled={loading}
            autoComplete="name"
          />
          <Field
            label="Phone"
            value={shipping.phone}
            onChange={(v) => update("phone", v)}
            placeholder="e.g. +44 7700 900000"
            disabled={loading}
            type="tel"
            autoComplete="tel"
          />

          {/* Postcode → address lookup */}
          <PostcodeLookup
            postalCode={shipping.postalCode}
            disabled={loading}
            onApply={(patch) => {
              if (patch.address) {
                onChange({
                  ...shipping,
                  address: patch.address,
                  city: patch.city,
                  postalCode: patch.postalCode,
                });
              } else {
                onChange({ ...shipping, postalCode: patch.postalCode });
              }
            }}
          />

          <Field
            label="Address"
            value={shipping.address}
            onChange={(v) => update("address", v)}
            placeholder="e.g. 1 Market Street"
            disabled={loading}
            autoComplete="street-address"
          />

          <Field
            label="City"
            value={shipping.city}
            onChange={(v) => update("city", v)}
            placeholder="e.g. London"
            disabled={loading}
            autoComplete="address-level2"
          />

          <Field
            label="Country"
            value={shipping.country}
            onChange={(v) => update("country", v)}
            placeholder="e.g. United Kingdom"
            disabled={loading}
            autoComplete="country-name"
          />

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={shipping.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="e.g. Delivery instructions"
              disabled={loading}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all resize-none disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 break-words">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-white/[0.06] flex-shrink-0 bg-white/[0.02]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60 flex-shrink-0"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit || loading}
            className="flex-1 relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2 min-w-0">
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="truncate">Preparing…</span>
                </>
              ) : (
                <span className="truncate">Continue · {formatCurrency(total)}</span>
              )}
            </span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Postcode → address lookup (Ideal Postcodes)                        */
/* ------------------------------------------------------------------ */

function PostcodeLookup({
  postalCode,
  onApply,
  disabled,
}: {
  postalCode: string;
  onApply: (patch: { address: string; city: string; postalCode: string }) => void;
  disabled?: boolean;
}) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const lookup = async () => {
    const cleaned = postalCode.trim().replace(/\s+/g, "");
    if (!cleaned) {
      setLookupError("Enter a postcode first");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_IDEAL_POSTCODES_API_KEY;
    if (!apiKey) {
      setLookupError("Address lookup is not configured — please enter manually.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setAddresses([]);

    try {
      const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(
          cleaned
        )}?api_key=${apiKey}`
      );

      if (!res.ok) {
        setLookupError("Could not find addresses for that postcode");
        return;
      }

      const json = await res.json();
      const results = json?.result ?? [];

      if (!results.length) {
        setLookupError("No addresses found for that postcode");
        return;
      }

      const options: AddressOption[] = results.map((r: any) => ({
        line_1: r.line_1 || "",
        line_2: r.line_2 || "",
        post_town: r.post_town || "",
        postcode: r.postcode || "",
      }));

      setAddresses(options);

      if (options.length === 1) {
        applyAddress(options[0]);
      }
    } catch (err) {
      console.error("Postcode lookup failed:", err);
      setLookupError("Address lookup failed. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const applyAddress = (addr: AddressOption) => {
    onApply({
      address: [addr.line_1, addr.line_2].filter(Boolean).join(", "),
      city: addr.post_town,
      postalCode: addr.postcode,
    });
    setAddresses([]);
    setLookupError(null);
  };

  return (
    <>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block mb-1.5">
          Postcode
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={postalCode}
            onChange={(e) =>
              onApply({
                address: "",
                city: "",
                postalCode: e.target.value,
              })
            }
            onBlur={lookup}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder="e.g. AB1 2CD"
            disabled={disabled || lookupLoading}
            autoComplete="postal-code"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 min-h-[42px]"
          />
          <button
            type="button"
            onClick={lookup}
            disabled={disabled || lookupLoading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-60 whitespace-nowrap"
          >
            {lookupLoading ? "Searching…" : "Find address"}
          </button>
        </div>
        {lookupError && (
          <p className="text-red-400 text-xs mt-1.5">{lookupError}</p>
        )}
      </div>

      {addresses.length > 0 && (
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block mb-1.5">
            Select address ({addresses.length} found)
          </label>
          <select
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx)) applyAddress(addresses[idx]);
            }}
            defaultValue=""
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all [color-scheme:dark]"
          >
            <option value="" disabled className="bg-slate-900 text-white">
              Choose an address…
            </option>
            {addresses.map((a, i) => (
              <option key={i} value={i} className="bg-slate-900 text-white">
                {[a.line_1, a.line_2].filter(Boolean).join(", ")}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable field                                                     */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "tel" | "email";
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="
          w-full bg-white/5 border border-white/10 rounded-xl
          px-3 py-2.5
          text-sm text-white placeholder-white/30
          focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20
          transition-all disabled:opacity-50
          min-h-[42px]
        "
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marketplace checkout modal (Stripe embedded)                       */
/* ------------------------------------------------------------------ */

function MarketplaceCheckoutModal({
  session,
  onClose,
  onComplete,
}: {
  session: CheckoutSession;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [finalising, setFinalising] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (paid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paid, onClose]);

  const pollForActivation = async () => {
    setFinalising(true);
    for (let i = 0; i < 20; i++) {
      try {
        const r = await fetch(`/api/auth/stripe/verify/${session.sessionId}`, {
          cache: "no-store",
        });
        if (r.ok) {
          const d = await r.json();
          if (d.status === "SUCCESS" || d.status === "PAID") {
            onComplete();
            return;
          }
        }
      } catch {
        // ignore transient errors
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
    setFinalising(false);
    onComplete();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-white/10 w-full max-w-xl my-0 sm:my-8 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-0.5 sm:mb-1">
              Order {session.orderNumber}
            </p>
            <h2 className="text-sm sm:text-base font-semibold text-white truncate">
              Complete payment · {formatCurrency(session.total)}
            </h2>
          </div>
                <button
            onClick={onClose}
            disabled={paid || finalising}
            className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="relative p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          <EmbeddedCheckoutProvider
            key={session.clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret: session.clientSecret,
              onComplete: async () => {
                setPaid(true);
                await pollForActivation();
              },
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>

          {(paid || finalising) && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <CheckCircleIcon className="h-10 w-10 text-emerald-400" />
              <p className="text-sm text-white/80">Payment successful</p>
              <p className="text-xs text-white/40">Finalising your order…</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-t border-white/[0.06] flex-shrink-0">
          <LockClosedIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
          <p className="text-xs text-white/50">
            Secure checkout · Dispatched by the supplier within their delivery window
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
            

        