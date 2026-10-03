// app/dashboard/support/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  LifebuoyIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface TicketForm {
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    category: "Account",
    question: "My salon application is still pending — how long does it take?",
    answer:
      "Our team typically completes reviews within 24–48 hours. You'll receive an email as soon as your account is approved. If it's been longer, please open a ticket and we'll look into it.",
  },
  {
    id: "faq-2",
    category: "Account",
    question: "Why was my salon application rejected?",
    answer:
      "Rejections are usually due to incomplete business details, an unverified address, or missing documentation. The exact reason is shown on your dashboard. You can update your details from Settings and resubmit — no need to contact support unless you have questions.",
  },
  {
    id: "faq-3",
    category: "Bookings",
    question: "How do I manage bookings from clients?",
    answer:
      "Every booking appears in the Bookings tab, grouped by day. You can confirm, cancel, complete, or reopen any booking from there. Clients receive automatic reminders 48 hours and 2 hours before their appointment.",
  },
  {
    id: "faq-4",
    category: "Payments",
    question: "When do I get paid for completed services?",
    answer:
      "Funds are held securely when a client books, then released to your account within 3 working days of the service being marked as complete. You can see the exact release dates on the Revenue page.",
  },
  {
    id: "faq-5",
    category: "Marketplace",
    question: "How do I order products from suppliers?",
    answer:
      "Open the Marketplace tab, browse by category, and add items to your cart. Checkout is a single step — you pay via your saved payment method and the supplier ships directly to you. Delivery times vary by supplier.",
  },
  {
    id: "faq-6",
    category: "Subscription",
    question: "What happens if my subscription expires?",
    answer:
      "Your salon will be hidden from the marketplace and new bookings will stop, but you keep access to your data during a 30-day grace period. You can reactivate any time from the Subscription tab.",
  },
  {
    id: "faq-7",
    category: "Account",
    question: "How do I change my password?",
    answer:
      "Go to Settings → Security. Enter your current password, then your new password twice. If you've forgotten your password, sign out and use the 'Forgot password' link on the login page.",
  },
  {
    id: "faq-8",
    category: "Bookings",
    question: "Can I block out time for holidays?",
    answer:
      "Yes. Go to Settings → Hours and mark the relevant days as 'Closed', or set a later open time. Existing bookings aren't affected — you'll need to cancel those manually from the Bookings tab.",
  },
];

const TICKET_CATEGORIES = [
  "Account & profile",
  "Bookings",
  "Payments",
  "Marketplace",
  "Subscription",
  "Bug report",
  "Something else",
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const [ticket, setTicket] = useState<TicketForm>({
    subject: "",
    category: TICKET_CATEGORIES[0],
    priority: "normal",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  /* ---------- Session expiring listener ---------- */
  useEffect(() => {
    const handler = () => {
      setError(null);
      setSubmitting(false);
    };
    window.addEventListener("session-expiring", handler);
    return () => window.removeEventListener("session-expiring", handler);
  }, []);

  /* ---------- Derived ---------- */
  const categories = ["All", ...Array.from(new Set(FAQ_ITEMS.map((f) => f.category)))];

  const filteredFAQs = FAQ_ITEMS.filter((faq) => {
    if (activeCategory !== "All" && faq.category !== activeCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term)
      );
    }
    return true;
  });

  /* ---------- Actions ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (ticket.subject.trim().length < 3) {
      setError("Please enter a subject for your ticket.");
      return;
    }
    if (ticket.message.trim().length < 10) {
      setError("Please describe your issue in a bit more detail.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticket),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to submit ticket");
      }

      setSubmitted(true);
      setTicket({
        subject: "",
        category: TICKET_CATEGORIES[0],
        priority: "normal",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Support
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Answers to common questions, or reach our team directly.
        </p>
      </div>

      {/* Contact methods row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <ContactCard
          icon={ChatBubbleLeftRightIcon}
          title="Live chat"
          description="Mon–Fri, 9am–6pm (UK)"
          action="Coming soon"
          disabled
        />
        <ContactCard
          icon={EnvelopeIcon}
          title="Email us"
          description="support@krownbraids.com"
          action="Usually replies within 1 working day"
        />
        <ContactCard
          icon={PhoneIcon}
          title="Call us"
          description="020 7946 0123"
          action="Mon–Fri, 9am–6pm (UK)"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Frequently asked questions
            </h2>
            <p className="text-white/40 text-sm">
              Search, or filter by topic.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FAQs…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          {filteredFAQs.length === 0 ? (
            <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 inline-flex mb-3">
                <BookOpenIcon className="h-8 w-8 text-cyan-400/60" />
              </div>
              <p className="text-white/50 text-sm">
                No FAQs match your search. Try a different keyword, or open a ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFAQs.map((faq) => {
                const open = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : faq.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-semibold mb-1">
                          {faq.category}
                        </p>
                        <p className="text-sm font-medium text-white">
                          {faq.question}
                        </p>
                      </div>
                      {open ? (
                        <ChevronUpIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-white/40 flex-shrink-0" />
                      )}
                    </button>
                    {open && (
                      <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                        <p className="text-sm text-white/60 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket form */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <div className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              <div className="p-6">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircleIcon className="h-7 w-7 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      Ticket submitted
                    </h3>
                    <p className="text-sm text-white/50 mb-6">
                      Our team has received your message and will reply to your
                      email within 1 working day.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Submit another ticket
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <LifebuoyIcon className="h-4 w-4 text-cyan-400" />
                      <h2 className="text-base font-semibold text-white">
                        Open a support ticket
                      </h2>
                    </div>
                    <p className="text-white/40 text-sm mb-5">
                      Describe your issue and we&apos;ll reply by email.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={ticket.subject}
                          onChange={(e) =>
                            setTicket({ ...ticket, subject: e.target.value })
                          }
                          placeholder="Short summary of the issue"
                          maxLength={120}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">
                          Category
                        </label>
                        <select
                          value={ticket.category}
                          onChange={(e) =>
                            setTicket({ ...ticket, category: e.target.value })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all [color-scheme:dark]"
                        >
                          {TICKET_CATEGORIES.map((c) => (
                            <option
                              key={c}
                              value={c}
                              className="bg-slate-900 text-white"
                            >
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">
                          Priority
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["low", "normal", "high"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTicket({ ...ticket, priority: p })}
                              className={`py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                                ticket.priority === p
                                  ? p === "high"
                                    ? "bg-red-500/15 text-red-300 border-red-500/30"
                                    : p === "normal"
                                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
                                    : "bg-white/10 text-white border-white/20"
                                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">
                          Message *
                        </label>
                        <textarea
                          value={ticket.message}
                          onChange={(e) =>
                            setTicket({ ...ticket, message: e.target.value })
                          }
                          placeholder="Please describe your issue in detail…"
                          rows={5}
                          maxLength={2000}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all resize-none"
                        />
                        <p className="text-white/25 text-[10px] mt-1 text-right">
                          {ticket.message.length} / 2000
                        </p>
                      </div>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-300 text-xs">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="relative w-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {submitting ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Sending…
                            </>
                          ) : (
                            <>
                              <PaperAirplaneIcon className="h-4 w-4" />
                              Send ticket
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Helpful links */}
            <div className="mt-4 relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-3">
                Helpful links
              </p>
              <div className="space-y-2">
                {[
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Cookie Policy", href: "/cookies" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 text-sm text-white/60 hover:text-cyan-300 transition-colors group"
                  >
                    <span>{link.label}</span>
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact card                                                       */
/* ------------------------------------------------------------------ */

function ContactCard({
  icon: Icon,
  title,
  description,
  action,
  disabled,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-5 overflow-hidden transition-all ${
        disabled ? "opacity-60" : "hover:border-white/20"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/60 mt-0.5 truncate">{description}</p>
          <p className="text-[11px] text-white/40 mt-2">{action}</p>
        </div>
      </div>
    </div>
  );
}