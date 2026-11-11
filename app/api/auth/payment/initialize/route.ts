// app/api/payment/initialize/route.ts
import { NextResponse } from "next/server";

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL ||
  "https://60a6-82-36-98-104.ngrok-free.app/pservice";

export async function POST(request: Request) {
  try {
    console.log("=== Salon Stripe Session API Route ===");

    const authorization = request.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { salonId, planId, billingCycle } = body;

    console.log("Stripe session request:", { salonId, planId, billingCycle });

    if (!salonId) {
      return NextResponse.json(
        { success: false, message: "Salon ID is required" },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Force userType: SALON — this route can only create salon sessions
    const payload = {
      userType: "SALON",
      salonId,
      planId,
      billingCycle: billingCycle || "monthly",
      paymentType: "SUBSCRIPTION",
    };

    const response = await fetch(
      `${PAYMENT_SERVICE_URL}/api/v1/auth/stripe/create-embedded-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authorization,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      }
    );

    const rawResponse = await response.text();
    console.log("Payment service response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || data.message || "Failed to create session",
        },
        { status: response.status }
      );
    }

    // Stripe returns { clientSecret, sessionId } — no redirect URL
    return NextResponse.json({
      success: true,
      clientSecret: data.clientSecret,
      sessionId: data.sessionId,
      message: "Payment session created",
    });
  } catch (error) {
    console.error("Stripe session API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}