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
} from "@heroicons/react/24/outline";

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
}

interface CartItem {
  product: Product;
  quantity: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);

/**
 * Convert a backend image path into a Next.js proxy path.
 *
 * Backend returns:  /uploads/products/abc/def.jpg
 * We serve via:     /api/uploads/products/abc/def.jpg
 */
const proxyImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";

  if (url.startsWith("/api/uploads/")) return url;
  if (url.startsWith("/uploads/")) return `/api${url}`;
  if (url.startsWith("uploads/")) return `/api/${url}`;

  const match = url.match(/ngrok-free\.app\/(?:supservice\/)?uploads\/(.+)$/);
  if (match) return `/api/uploads/${match[1]}`;

  return url;
};

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

  /* ---------- Load products ---------- */
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);

      try {
        const res = await fetch("/api/auth/marketplace/products");
        if (!res.ok) {
          throw new Error(`Failed to load products (${res.status})`);
        }

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
        }));

        setProducts(mapped);
      } catch (err) {
        console.error("Error loading products:", err);
        setProductsError(
          err instanceof Error ? err.message : "Failed to load products"
        );
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
        const res = await fetch("/api/auth/cat");
        if (!res.ok) {
          throw new Error(`Failed to load categories (${res.status})`);
        }

        const json = await res.json();
        const raw: Category[] = Array.isArray(json) ? json : json.data || [];
        const sorted = [...raw].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

        setCategories(sorted);
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategoriesError(
          err instanceof Error ? err.message : "Failed to load categories"
        );
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
      try {
        setCart(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("salonCart", JSON.stringify(cart));
  }, [cart]);

  /**
   * When the session is about to expire, close any open modal or transient
   * UI so the session expiry warning gets the user's full attention.
   */
  useEffect(() => {
    const handler = () => {
      setSelectedProduct(null);
      setCartOpen(false);
      setShowSuccess(null);
      setProductsError(null);
      setCategoriesError(null);
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
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  /* ---------- Actions ---------- */
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

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Marketplace
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Trade prices from vetted UK wholesalers.
          </p>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="self-start sm:self-auto relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <ShoppingBagIcon className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Errors */}
      {(categoriesError || productsError) && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            {productsError
              ? "Couldn't load products."
              : "Couldn't load categories — showing all products."}
          </p>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">{showSuccess}</p>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
            showFilters
              ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-300"
              : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
          }`}
          aria-label="Filters"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400/50 [color-scheme:dark]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-slate-900 text-white"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-white/40 text-xs block mb-1">
                Max price: {formatCurrency(priceRange[1])}
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], parseInt(e.target.value)])
                }
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSortBy("newest");
                  setPriceRange([0, 500]);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <ArrowPathIcon className="h-3 w-3" />
                Reset filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {categoriesLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-9 w-24 rounded-xl bg-white/5 border border-white/10 animate-pulse"
              />
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                title={cat.description}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  selectedCategory === cat.name
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Results count */}
      <p className="text-white/40 text-xs mb-3">
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        {selectedCategory !== "all" && ` in ${selectedCategory}`}
      </p>

      {/* Product grid */}
      {productsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10">
              <ShoppingBagIcon className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No products found
          </h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Try a different search term, or reset the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => addToCart(product)}
              onView={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      )}

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        subtotal={cartSubtotal}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      {/* Product detail modal */}
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
}: {
  product: Product;
  onAdd: () => void;
  onView: () => void;
}) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0;

  const isLowStock = product.stockQuantity < 30 && product.stockQuantity > 0;
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <button
        onClick={onView}
        className="relative aspect-square overflow-hidden bg-white/5"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-white/15" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="text-[10px] font-bold bg-red-500/90 text-white px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-bold bg-white/90 text-black px-2 py-0.5 rounded-full">
              OUT OF STOCK
            </span>
          )}
        </div>

        {isLowStock && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-semibold bg-amber-500/20 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
              Only {product.stockQuantity} left
            </span>
          </div>
        )}
      </button>

      <div className="p-3 flex-1 flex flex-col">
        {product.category && (
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium truncate">
            {product.category}
          </p>
        )}
        <button onClick={onView} className="text-left mt-0.5 group/title">
          <h3 className="text-sm font-medium text-white line-clamp-2 group-hover/title:text-cyan-300 transition-colors">
            {product.name}
          </h3>
        </button>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-white">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-white/30 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <button
          onClick={onAdd}
          disabled={isOutOfStock}
          className="mt-3 relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg py-2 text-xs font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group/btn overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            {isOutOfStock ? "Out of stock" : "Add to cart"}
          </span>
          {!isOutOfStock && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          )}
        </button>
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
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end md:pl-72">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md h-full backdrop-blur-2xl bg-slate-900/95 border-l border-white/10 flex flex-col shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Your cart
              {cart.length > 0 && (
                <span className="text-white/40 font-normal ml-1">
                  ({cart.length} item{cart.length !== 1 ? "s" : ""})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close cart"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center">
                <ShoppingBagIcon className="h-7 w-7 text-cyan-400" />
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">
                Your cart is empty
              </p>
              <p className="text-white/40 text-xs">
                Browse the marketplace to add products.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
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

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-cyan-300 mt-0.5 font-medium">
                      {formatCurrency(item.product.price)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1.5 hover:bg-white/10 rounded-l-lg transition-colors"
                          aria-label="Decrease"
                        >
                          <MinusIcon className="h-3 w-3 text-white/70" />
                        </button>
                        <span className="text-xs font-medium text-white px-2 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1.5 hover:bg-white/10 rounded-r-lg transition-colors"
                          aria-label="Increase"
                        >
                          <PlusIcon className="h-3 w-3 text-white/70" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemove(item.product.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-300 transition-colors"
                        aria-label="Remove"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length > 1 && (
                <button
                  onClick={onClear}
                  className="w-full text-xs text-white/40 hover:text-red-300 transition-colors text-center py-2"
                >
                  Clear all items
                </button>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Subtotal</span>
              <span className="text-lg font-bold text-white">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-white/40">
              Delivery calculated at checkout · VAT included
            </p>

            <button className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden">
              <span className="relative z-10">Proceed to checkout</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
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
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0;

  const isOutOfStock = product.stockQuantity <= 0;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 md:pl-72 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-4xl my-0 sm:my-8 shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <p className="text-xs uppercase tracking-wider text-white/40 font-medium">
            {product.category || "Product"}
          </p>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-white/15" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-white/30 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                  −{discount}%
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-white/60 mt-4 leading-relaxed">
                {product.description}
              </p>
            )}

            <p className="text-xs text-white/50 mt-3">
              <span
                className={
                  isOutOfStock
                    ? "text-red-400 font-medium"
                    : product.stockQuantity < 30
                    ? "text-amber-400 font-medium"
                    : ""
                }
              >
                {isOutOfStock
                  ? "Out of stock"
                  : `${product.stockQuantity} in stock`}
              </span>
            </p>

            <div className="mt-auto pt-5 flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-white/10 rounded-l-xl transition-colors"
                  aria-label="Decrease"
                >
                  <MinusIcon className="h-4 w-4 text-white/70" />
                </button>
                <span className="text-sm font-medium text-white px-3 min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-white/10 rounded-r-xl transition-colors"
                  aria-label="Increase"
                >
                  <PlusIcon className="h-4 w-4 text-white/70" />
                </button>
              </div>

              <button
                onClick={() => onAdd(quantity)}
                disabled={isOutOfStock}
                className="flex-1 relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  {isOutOfStock ? "Out of stock" : "Add to cart"}
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