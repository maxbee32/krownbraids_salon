// app/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  XMarkIcon,
  Bars3Icon,
  StarIcon,
  UsersIcon,
  HeartIcon,
  SparklesIcon,
  ScissorsIcon,
  SwatchIcon,
  CameraIcon,
  GiftIcon,
  PhoneIcon,
  TrophyIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  BanknotesIcon,
  Squares2X2Icon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Brand logo                                                         */
/* ------------------------------------------------------------------ */
function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-2xl font-bold text-white tracking-tight ${className}`}>
      KROWN
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        BRAIDS
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Gradient Button                                                    */
/* ------------------------------------------------------------------ */
function GradientButton({
  children,
  href,
  onClick,
  variant = "solid",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 group overflow-hidden";

  const variants: Record<string, string> = {
    solid:
      "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30",
    outline:
      "border border-white/15 text-white/80 hover:border-cyan-400/50 hover:text-cyan-300 bg-white/5 backdrop-blur-sm",
    ghost: "text-white/60 hover:text-white",
  };

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "solid" && (
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {inner}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared background — matches login page                             */
/* ------------------------------------------------------------------ */
function PageBackground() {
  return (
    <>
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="relative w-full h-full">
          <Image
            src="/assets/styke-12.webp"
            alt="Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay"></div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <PageBackground />

      {/* ============================= NAV ============================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex-shrink-0">
              <Logo />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-sm text-white/60 hover:text-cyan-400 transition-colors">
                Platform
              </a>
              <a href="#marketplace" className="text-sm text-white/60 hover:text-cyan-400 transition-colors">
                Marketplace
              </a>
              <a href="#pricing" className="text-sm text-white/60 hover:text-cyan-400 transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-sm text-white/60 hover:text-cyan-400 transition-colors">
                Contact
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm px-5 py-2.5 text-white/70 hover:text-cyan-400 transition-colors"
              >
                Sign In
              </Link>
              <GradientButton href="/signup" className="text-sm">
                Register Salon
                <ArrowRightIcon className="w-4 h-4" />
              </GradientButton>
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6 text-white/80" />
            </button>
          </div>
        </div>
      </nav>

      {/* ============================= MOBILE MENU ============================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 backdrop-blur-2xl bg-white/5 border-l border-white/10 p-6">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              {[
                { href: "#platform", label: "Platform" },
                { href: "#marketplace", label: "Marketplace" },
                { href: "#pricing", label: "Pricing" },
                { href: "#contact", label: "Contact" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60 hover:text-cyan-400 py-2 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <GradientButton
                href="/login"
                variant="outline"
                className="w-full justify-center"
              >
                Sign In
              </GradientButton>
              <GradientButton href="/signup" className="w-full justify-center">
                Register Salon
                <ArrowRightIcon className="w-4 h-4" />
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* ============================= HERO ============================= */}
        <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md text-white/80 px-4 py-2 rounded-full text-xs md:text-sm font-medium mb-6 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Trusted by salons across the UK
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-bold text-white leading-[1.05] tracking-tight">
                  Run your salon.
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                    Book clients. Stock up.
                  </span>
                </h1>

                <p className="mt-6 text-base md:text-lg text-white/60 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  KrownBraids is the operating system for UK beauty salons.
                  Take bookings, manage your diary and staff, and order
                  supplies from vetted wholesalers — all from one dashboard.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <GradientButton href="/signup">
                    Register Your Salon
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GradientButton>
                  <GradientButton href="/login" variant="outline">
                    Sign In
                  </GradientButton>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-left">
                  <div className="flex -space-x-3">
                    {["A", "M", "K", "S", "J"].map((letter, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-slate-900 flex items-center justify-center text-white text-sm font-semibold backdrop-blur-sm"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Loved by independent salon owners
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIcon
                          key={i}
                          className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400"
                        />
                      ))}
                      <span className="text-xs text-white/40 ml-1">
                        Rated by our salon community
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero preview — diary + supplier reorder */}
              <div className="relative lg:flex justify-end">
                <div className="relative w-full max-w-md mx-auto lg:mx-0">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

                  <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                            <CalendarDaysIcon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Today's diary
                            </p>
                            <p className="text-xs text-white/40">
                              Krown Braids · London
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
                          Live
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { time: "09:30", name: "Amara O.", service: "Knotless braids", dur: "4h" },
                          { time: "11:00", name: "Priya S.", service: "Cornrows", dur: "2h" },
                          { time: "14:30", name: "Chloe M.", service: "Consultation", dur: "30m" },
                        ].map((apt, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                          >
                            <div className="w-11 text-[11px] font-mono text-cyan-300">
                              {apt.time}
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                {apt.name}
                              </p>
                              <p className="text-xs text-white/40">{apt.service}</p>
                            </div>
                            <span className="text-[10px] text-white/50">
                              {apt.dur}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-white/80 tracking-wide uppercase">
                            Low stock
                          </p>
                          <span className="text-[10px] text-cyan-400">Reorder</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20">
                          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <ShoppingBagIcon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              X-Pression braiding hair
                            </p>
                            <p className="text-xs text-white/40">
                              4 left · from Beauty Depot UK
                            </p>
                          </div>
                          <BanknotesIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= TRUST STRIP ============================= */}
        <section className="py-10 md:py-12 px-4 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-[11px] text-white/30 mb-6 tracking-[0.2em] uppercase">
              Salons registered with us in
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-60">
              {["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Bristol"].map(
                (city, i) => (
                  <span
                    key={i}
                    className="text-sm md:text-base font-semibold text-white/50 tracking-wide"
                  >
                    {city}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* ============================= PLATFORM (3 pillars) ============================= */}
        <section id="platform" className="py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-14 md:mb-20">
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-3">
                The platform
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                One login. Three things every salon actually needs.
              </h2>
              <p className="mt-4 text-base text-white/50 max-w-2xl">
                No bloated feature list. Just the tools that save you hours
                each week and keep your business growing.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={i}
                    className="relative backdrop-blur-2xl bg-white/5 p-7 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-cyan-400 uppercase mb-2">
                      {p.kicker}
                    </p>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {p.title}
                    </h3>
                    <p className="text-sm text-white/55 leading-relaxed">
                      {p.description}
                    </p>
                    <ul className="mt-5 space-y-2">
                      {p.points.map((pt, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                          <CheckBadgeIcon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================= MARKETPLACE ============================= */}
        <section id="marketplace" className="py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-3">
                  Supplier marketplace
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Order supplies without leaving your dashboard.
                </h2>
                <p className="mt-4 text-base text-white/55 max-w-lg">
                  Browse UK wholesalers, compare trade prices, and reorder
                  your regular stock in a couple of clicks. Invoices land in
                  the same place as your bookings.
                </p>

                <div className="mt-8 space-y-4">
                  {marketplaceFeatures.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {f.title}
                          </p>
                          <p className="text-sm text-white/50 mt-0.5">
                            {f.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <GradientButton href="/signup" variant="outline">
                    Browse the marketplace
                    <ArrowRightIcon className="w-4 h-4" />
                  </GradientButton>
                </div>
              </div>

              {/* Right side — supplier card stack */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl" />

                <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-sm font-semibold text-white">
                      Wholesale suppliers
                    </p>
                    <span className="text-[10px] text-white/40">
                      12 available
                    </span>
                  </div>

                  <div className="space-y-3">
                    {suppliers.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/20 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                          <TruckIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {s.name}
                          </p>
                          <p className="text-xs text-white/40">
                            {s.category} · {s.location}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-cyan-300">
                          {s.lead}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Trade prices</span>
                    <span>Verified UK suppliers only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= FEATURES (grid) ============================= */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-14 md:mb-20">
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-3">
                Built into every account
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                Small details that add up.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="group relative backdrop-blur-2xl bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mb-4 group-hover:border-cyan-400/30 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================= PRICING ============================= */}
        <section id="pricing" className="py-20 md:py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

              <div className="relative p-10 md:p-14">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-3">
                      Pricing
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      A simple monthly subscription.
                    </h2>
                    <p className="mt-4 text-sm md:text-base text-white/55">
                      One flat fee per salon. No commission on your bookings.
                      No hidden charges. Cancel whenever you like.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <GradientButton href="/signup">
                        Start your subscription
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </GradientButton>
                      <GradientButton href="/contact" variant="outline">
                        Talk to us
                      </GradientButton>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-xs text-white/40 mb-1">From</p>
                    <p className="text-4xl font-bold text-white">
                      £29<span className="text-base font-medium text-white/40">/month</span>
                    </p>
                    <p className="text-xs text-white/40 mt-2">
                      Billed monthly. Cancel anytime.
                    </p>
                    <ul className="mt-6 space-y-2.5">
                      {[
                        "Unlimited bookings",
                        "Client records & notes",
                        "Staff & rota management",
                        "Supplier marketplace access",
                        "UK-based support",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <CheckBadgeIcon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= CONTACT / CTA ============================= */}
        <section id="contact" className="py-20 md:py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

              <div className="relative p-10 md:p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheckIcon className="w-7 h-7 text-cyan-400" />
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Ready to run your salon properly?
                </h2>
                <p className="mt-4 text-base md:text-lg text-white/55 max-w-2xl mx-auto">
                  Set up your account in under five minutes. Pick a plan,
                  take bookings today, cancel whenever you like.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <GradientButton href="/signup">
                    Register Your Salon
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GradientButton>
                  <GradientButton href="/login" variant="outline">
                    Sign In
                  </GradientButton>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
                  <span>Subscription-based</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>UK GDPR compliant</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================= FOOTER ============================= */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-2xl bg-black/20 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 text-white/40 text-sm max-w-xs">
                The operating system for UK beauty salons — bookings,
                clients, and suppliers in one place.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-white">Platform</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Bookings</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Client CRM</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Staff & rota</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Reporting</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-white">Marketplace</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Browse suppliers</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Trade pricing</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Become a supplier</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-white">Company</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">About</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Blog</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-white">Legal</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Terms</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Privacy</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">Cookies</li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">GDPR</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} KrownBraids. All rights reserved.
            </p>
            <p className="text-white/30 text-xs">
              Made in the UK 🇬🇧
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const pillars = [
  {
    icon: CalendarDaysIcon,
    kicker: "Bookings",
    title: "Your diary, organised",
    description:
      "Clients book themselves in, you approve what suits you. Reminders and rescheduling all handled.",
    points: [
      "Online booking that fits your rota",
      "SMS + email reminders that cut no-shows",
      "Manage one or multiple stylists",
    ],
  },
  {
    icon: UsersIcon,
    kicker: "Clients",
    title: "Every client, remembered",
    description:
      "Notes, formulas, allergies, preferred stylists and visit history — searchable in seconds.",
    points: [
      "Client profiles with private notes",
      "Rebooking prompts after visits",
      "GDPR-compliant data storage",
    ],
  },
  {
    icon: ShoppingBagIcon,
    kicker: "Suppliers",
    title: "Stock up without leaving",
    description:
      "Order hair, products and tools directly from vetted UK wholesalers at trade prices.",
    points: [
      "Compare prices across suppliers",
      "Reorder your regular stock in one tap",
      "All invoices in a single account",
    ],
  },
];

const marketplaceFeatures = [
  {
    icon: ShieldCheckIcon,
    title: "Verified UK wholesalers",
    description:
      "Every supplier is vetted before listing. No dropshippers, no fakes.",
  },
  {
    icon: BanknotesIcon,
    title: "Trade prices, not retail",
    description:
      "Wholesale pricing unlocked for registered salons — no minimum orders.",
  },
  {
    icon: TruckIcon,
    title: "Track orders in the app",
    description:
      "Delivery updates and invoices appear next to your bookings.",
  },
  {
    icon: LockClosedIcon,
    title: "Secure payments",
    description:
      "Funds are held securely and released to the supplier once your order is confirmed as received.",
  },
];

const suppliers = [
  { name: "Beauty Depot UK", category: "Braiding hair", location: "London", lead: "1–2 days" },
  { name: "Crown Supplies", category: "Styling tools", location: "Manchester", lead: "Next day" },
  { name: "Silk Route Hair", category: "Extensions", location: "Birmingham", lead: "2–3 days" },
  { name: "Natural Root Co.", category: "Hair care", location: "Leeds", lead: "Next day" },
];

const features = [
  {
    icon: CalendarDaysIcon,
    title: "Smart diary",
    description: "Day, week and stylist views. Drag to reschedule, colour-code by service.",
  },
  {
    icon: CreditCardIcon,
    title: "Secure client payments",
    description:
      "Clients pay through the platform. Funds are held and released to you once the service is complete.",
  },
  {
    icon: ChartBarIcon,
    title: "Reports that matter",
    description: "Revenue, retention, best-selling services — export to CSV or PDF.",
  },
  {
    icon: PhoneIcon,
    title: "Automatic reminders",
    description: "SMS and email confirmations sent at 48h and 2h before each appointment.",
  },
  {
    icon: TrophyIcon,
    title: "Staff & rota",
    description: "Manage stylist rotas, holidays and time off from one dashboard.",
  },
  {
    icon: Squares2X2Icon,
    title: "Multi-location ready",
    description: "Manage several sites from one login. Each with its own diary and staff.",
  },
  {
    icon: ShoppingBagIcon,
    title: "Supplier orders",
    description: "Buy hair, products and tools from the built-in UK marketplace.",
  },
  {
    icon: ShieldCheckIcon,
    title: "UK GDPR compliant",
    description: "Client data hosted in the UK. Full export on request. No lock-in.",
  },
  {
    icon: GlobeAltIcon,
    title: "Built for UK salons",
    description:
      "Pricing in pounds, UK support hours, and product designed around how UK salons actually work.",
  },
];