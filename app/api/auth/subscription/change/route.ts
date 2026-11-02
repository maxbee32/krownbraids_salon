// app/api/auth/subscription/change/route.ts
import { NextRequest, NextResponse } from "next/server";

const AUTH_BACKEND = "https://4ef0-82-36-98-104.ngrok-free.app/aservice";
const BUSINESS_BACKEND = "https://4ef0-82-36-98-104.ngrok-free.app/bservice";
const PAYMENT_BACKEND = "https://4ef0-82-36-98-104.ngrok-free.app/pservice";

const NGrok_HEADERS = { "ngrok-skip-browser-warning": "true" } as const;

function unwrap<T = any>(body: any): T {
  if (body && typeof body === "object" && "data" in body && body.data != null) {
    return body.data as T;
  }
  return body as T;
}

async function loadSalonForUser(token: string) {
  const onboardingRes = await fetch(
    `${BUSINESS_BACKEND}/api/v1/auth/business/salons/onboarding`,
    { headers: { Authorization: `Bearer ${token}`, ...NGrok_HEADERS } }
  );

  if (!onboardingRes.ok) {
    const raw = await onboardingRes.text();
    console.error(
      "[subscription-change] onboarding lookup failed",
      "status=", onboardingRes.status,
      "body=", raw
    );
    return null;
  }

  const onboarding = unwrap<any>(await onboardingRes.json());
  const salonId: number | undefined = onboarding?.salonId ?? onboarding?.id;
  if (!salonId) return null;

  const salonRes = await fetch(
    `${BUSINESS_BACKEND}/api/v1/auth/business/salons/${salonId}`,
    { headers: { Authorization: `Bearer ${token}`, ...NGrok_HEADERS } }
  );

  if (!salonRes.ok) {
    const raw = await salonRes.text();
    console.error(
      "[subscription-change] salon lookup failed",
      "status=", salonRes.status,
      "body=", raw
    );
    return null;
  }

  return unwrap<any>(await salonRes.json());
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const requestedPlanId = body.planId;
    const billingCycle: "monthly" | "yearly" =
      body.billingCycle === "yearly" ? "yearly" : "monthly";

    if (!requestedPlanId) {
      return NextResponse.json(
        { message: "planId is required" },
        { status: 400 }
      );
    }

    /* ---------- 1. Load the requested plan ---------- */
    const planRes = await fetch(
      `${AUTH_BACKEND}/api/v1/auth/subscription-plans/${requestedPlanId}`,
      { headers: { Authorization: `Bearer ${token}`, ...NGrok_HEADERS } }
    );

    if (!planRes.ok) {
      const rawBody = await planRes.text();
      console.error(
        "[subscription-change] plan lookup failed",
        "status=", planRes.status,
        "planId=", requestedPlanId,
        "body=", rawBody
      );
      if (planRes.status === 401 || planRes.status === 403) {
        return NextResponse.json(
          { message: "Not allowed to view this plan.", detail: rawBody },
          { status: planRes.status }
        );
      }
      if (planRes.status >= 500) {
        return NextResponse.json(
          { message: "Plan service error", detail: rawBody },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { message: `Plan ${requestedPlanId} not found.` },
        { status: 404 }
      );
    }

    const requestedPlan = await planRes.json();
    const isRequestingFree = Number(requestedPlan.monthlyPrice) === 0;

    /* ---------- 2. Load the salon ---------- */
    const salon = await loadSalonForUser(token);
    if (!salon) {
      return NextResponse.json({ message: "Salon not found" }, { status: 404 });
    }
    const salonId: number = salon.id;

    if (!salonId) {
      return NextResponse.json(
        { message: "Salon ID could not be resolved" },
        { status: 500 }
      );
    }

    /* ---------- 3. Free-plan eligibility (only when requesting free) ---------- */
    if (isRequestingFree) {
      if (salon.selectedPlanId) {
        const currentPlanRes = await fetch(
          `${AUTH_BACKEND}/api/v1/auth/subscription-plans/${salon.selectedPlanId}`,
          { headers: { Authorization: `Bearer ${token}`, ...NGrok_HEADERS } }
        );
        if (currentPlanRes.ok) {
          const currentPlan = await currentPlanRes.json();
          if (Number(currentPlan.monthlyPrice) > 0) {
            return NextResponse.json(
              { message: "You can't downgrade from a paid plan to a free plan." },
              { status: 400 }
            );
          }
        }
      }

      const subStart =
        salon.subscriptionStartDate ?? salon.SubscriptionStartDate;
      if (subStart) {
        return NextResponse.json(
          { message: "You've already used your free trial." },
          { status: 400 }
        );
      }
    }

    /* ---------- 4a. FREE plan → apply immediately ---------- */
    if (isRequestingFree) {
      const now = new Date();
      const trialDays = Number(requestedPlan.trialDays) > 0
        ? Number(requestedPlan.trialDays)
        : 30;
      const end = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const res = await fetch(
        `${BUSINESS_BACKEND}/api/v1/auth/business/salons/${salonId}/subscription`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...NGrok_HEADERS,
          },
          body: JSON.stringify({
            planId: requestedPlanId,
            subscriptionStartDate: now.toISOString(),
            subscriptionEndDate: end.toISOString(),
          }),
        }
      );

      const rawText = await res.text();
      if (!res.ok) {
        console.error(
          "[subscription-change] free apply failed",
          "status=", res.status,
          "salonId=", salonId,
          "body=", rawText
        );
        return NextResponse.json(
          { message: "Could not activate free plan", detail: rawText },
          { status: 502 }
        );
      }

      return NextResponse.json({
        requiresPayment: false,
        success: true,
        message: `Subscription changed to ${requestedPlan.name ?? "free plan"}`,
        planId: requestedPlan.id,
        planCode: requestedPlan.code,
      });
    }

    /* ---------- 4b. PAID plan → Stripe embedded checkout ---------- */
    const checkoutRes = await fetch(
      `${PAYMENT_BACKEND}/api/v1/auth/stripe/create-embedded-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...NGrok_HEADERS,
        },
        body: JSON.stringify({
          userType: "SALON",
          salonId,
          planId: requestedPlanId,
          billingCycle,
          paymentType: "SUBSCRIPTION",
        }),
      }
    );

    const checkoutRaw = await checkoutRes.text();
    let checkout: any;
    try {
      checkout = checkoutRaw ? JSON.parse(checkoutRaw) : {};
    } catch {
      checkout = { message: checkoutRaw };
    }

    if (!checkoutRes.ok) {
      console.error(
        "[subscription-change] checkout failed",
        "status=", checkoutRes.status,
        "salonId=", salonId,
        "planId=", requestedPlanId,
        "body=", checkoutRaw
      );
      return NextResponse.json(
        {
          message: checkout.message ?? checkout.error ?? "Could not start checkout",
          detail: checkoutRaw,
        },
        { status: 502 }
      );
    }

    const clientSecret: string | null =
      checkout.clientSecret ?? checkout.client_secret ?? null;
    const checkoutUrl: string | null =
      checkout.url ?? checkout.checkoutUrl ?? null;
    const sessionId: string | null = checkout.sessionId ?? checkout.id ?? null;

    console.log("[subscription-change] checkout session created:", {
      salonId,
      planId: requestedPlanId,
      billingCycle,
      hasClientSecret: !!clientSecret,
      hasCheckoutUrl: !!checkoutUrl,
      sessionId,
    });

    if (!clientSecret && !checkoutUrl) {
      console.error(
        "[subscription-change] Stripe session created but no clientSecret or checkoutUrl returned",
        checkout
      );
      return NextResponse.json(
        {
          message: "Checkout could not be started — no session returned",
          detail: checkout,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      requiresPayment: true,
      clientSecret,
      checkoutUrl,
      sessionId,
      amount: checkout.amount ?? null,
      planId: requestedPlanId,
      planCode: requestedPlan.code,
      billingCycle,
    });
  } catch (error: any) {
    console.error("[subscription-change] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}