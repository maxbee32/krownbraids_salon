// app/dashboard/subscription/checkout/page.tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, Suspense } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const clientSecret = params.get("clientSecret");
  const sessionId = params.get("sessionId");

  const onComplete = useCallback(async () => {
    if (!sessionId) {
      router.push("/dashboard/subscription?success=1");
      router.refresh();
      return;
    }
    for (let i = 0; i < 15; i++) {
      const r = await fetch(`/api/auth/stripe/verify/${sessionId}`);
      if (r.ok) {
        const d = await r.json();
        if (d.status === "SUCCESS") {
          router.push("/dashboard/subscription?success=1");
          router.refresh();
          return;
        }
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
    router.push("/dashboard/subscription?pending=1");
  }, [router, sessionId]);

  if (!clientSecret) {
    return (
      <div className="p-10 text-center text-white/60">
        Missing checkout session. Please select a plan again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">
        Complete your subscription
      </h1>
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center text-white/60">Loading…</div>}
    >
      <Inner />
    </Suspense>
  );
}