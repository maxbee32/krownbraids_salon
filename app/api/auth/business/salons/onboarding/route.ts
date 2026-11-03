// app/api/auth/business/salons/onboarding/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===================================================== */
/*  CONFIGURATION                                        */
/* ===================================================== */

const BACKEND_BASE = "https://9277-82-36-98-104.ngrok-free.app";
const BACKEND_URL = `${BACKEND_BASE}/bservice/api/v1/auth/business/salons`;

/* ===================================================== */
/*  TYPES                                                */
/* ===================================================== */

interface OnboardingRequestBody {
  salonId?: number | null;
  step?: string;            // "BUSINESS" | "PLAN" | "PAYMENT" | "REVIEW"
  completed?: boolean;
  selectedPlanId?: number | null;
  businessData?: unknown;
}

/* ===================================================== */
/*  GET — Fetch current onboarding state                 */
/* ===================================================== */

export async function GET(request: Request) {
  try {
    console.log("=== Get Salon Onboarding API Route (GET) ===");

    const authorization =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/onboarding`;
    console.log("Calling business service:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    console.log("Business service status:", response.status);

    const rawResponse = await response.text();
    console.log("Raw onboarding response:", rawResponse || "[empty]");

    let data: unknown;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse || "Failed to retrieve onboarding information" };
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string };
      return NextResponse.json(
        {
          message:
            errObj.message ||
            errObj.error ||
            "Failed to retrieve onboarding information",
          ...(typeof data === "object" && data !== null ? data : {}),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Salon onboarding GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ===================================================== */
/*  PUT — Save onboarding progress                       */
/* ===================================================== */

export async function PUT(request: Request) {
  try {
    console.log("=== Save Salon Onboarding API Route (PUT) ===");

    const body = (await request.json()) as OnboardingRequestBody;

    const authorization =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Forward the body as-is. The frontend already sends the correct
    // `step` string ("BUSINESS" | "PLAN" | "PAYMENT" | "REVIEW").
    // Do NOT remap from a numeric `currentStep` — that field no longer
    // exists in the frontend payload, and remapping silently forces
    // every request back to "BUSINESS".
    const mappedBody: OnboardingRequestBody = {
      salonId: body.salonId ?? null,
      step: body.step,
      completed: body.completed ?? false,
      selectedPlanId: body.selectedPlanId ?? null,
    };

    if (body.businessData !== undefined && body.businessData !== null) {
      mappedBody.businessData = body.businessData;
    }

    const backendUrl = `${BACKEND_URL}/onboarding`;

    console.log("Calling business service:", backendUrl);
    console.log("Request body:", JSON.stringify(mappedBody, null, 2));

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(mappedBody),
    });

    console.log("Business service status:", response.status);

    const rawResponse = await response.text();
    console.log("Raw save onboarding response:", rawResponse || "[empty]");

    let data: unknown;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse || "Failed to save onboarding progress" };
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string };
      return NextResponse.json(
        {
          message:
            errObj.message ||
            errObj.error ||
            "Failed to save onboarding progress",
          ...(typeof data === "object" && data !== null ? data : {}),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Save onboarding PUT error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}