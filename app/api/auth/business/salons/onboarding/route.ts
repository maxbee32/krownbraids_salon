// app/api/auth/business/salons/onboarding/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =====================================================
// CONFIGURATION
// =====================================================

const BACKEND_BASE = "https://178e-82-36-98-104.ngrok-free.app";
const BACKEND_URL = `${BACKEND_BASE}/bservice/api/auth/v1/business/salons`;

// =====================================================
// TYPES
// =====================================================

interface OnboardingRequestBody {
  salonId: any;
  currentStep?: number;
  step?: string;
  completed?: boolean;
  selectedPlanId?: any;
  businessData?: any; // Add this optional property
}

// =====================================================
// GET SALON ONBOARDING
// =====================================================

export async function GET(request: Request) {
  try {
    console.log("=== Get Salon Onboarding API Route ===");

    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

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
    });

    console.log("Business service status:", response.status);

    const rawResponse = await response.text();

    console.log("Raw onboarding response:", rawResponse);

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to retrieve onboarding information",
      };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to retrieve onboarding information",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Salon onboarding API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// SAVE SALON ONBOARDING - PUT
// =====================================================

export async function PUT(request: Request) {
  try {
    console.log("=== Save Salon Onboarding API Route (PUT) ===");

    const body = await request.json() as OnboardingRequestBody;

    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Map frontend data to backend expected format
    const stepMap = ['BUSINESS', 'PLAN', 'PAYMENT', 'REVIEW'];
    
    const mappedBody: OnboardingRequestBody = {
      salonId: body.salonId,
      step: stepMap[body.currentStep || 0] || 'BUSINESS',
      completed: body.currentStep === 3,
      selectedPlanId: body.selectedPlanId || null,
    };

    // Only add businessData if it exists
    if (body.businessData) {
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

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to save onboarding progress",
      };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to save onboarding progress",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Save onboarding API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// SAVE SALON ONBOARDING - POST (Fallback)
// =====================================================

export async function POST(request: Request) {
  try {
    console.log("=== Save Salon Onboarding API Route (POST Fallback) ===");

    const body = await request.json() as OnboardingRequestBody;

    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Try with salonId in URL path
    const { salonId, ...rest } = body;
    
    let backendUrl;
    let requestBody;

    // Attempt 1: Try with salonId in URL
    if (salonId) {
      backendUrl = `${BACKEND_URL}/${salonId}/onboarding`;
      requestBody = rest;
    } else {
      backendUrl = `${BACKEND_URL}/onboarding`;
      requestBody = body;
    }

    console.log("Calling business service:", backendUrl);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Business service status:", response.status);

    const rawResponse = await response.text();

    console.log("Raw save onboarding response:", rawResponse || "[empty]");

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to save onboarding progress",
      };
    }

    if (!response.ok) {
      // If POST fails, try PUT as fallback
      console.log("POST failed, trying PUT fallback...");
      
      const fallbackResponse = await fetch(`${BACKEND_URL}/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify(body),
      });

      console.log("Fallback PUT status:", fallbackResponse.status);

      if (fallbackResponse.ok) {
        const fallbackRaw = await fallbackResponse.text();
        let fallbackData;
        try {
          fallbackData = JSON.parse(fallbackRaw);
        } catch {
          fallbackData = { message: fallbackRaw || "Saved successfully" };
        }
        return NextResponse.json(fallbackData, { status: 200 });
      }

      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to save onboarding progress",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Save onboarding API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// SAVE SALON ONBOARDING - PATCH (Additional Support)
// =====================================================

export async function PATCH(request: Request) {
  try {
    console.log("=== Save Salon Onboarding API Route (PATCH) ===");

    const body = await request.json() as OnboardingRequestBody;

    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Map frontend data to backend expected format
    const stepMap = ['BUSINESS', 'PLAN', 'PAYMENT', 'REVIEW'];
    
    const mappedBody: OnboardingRequestBody = {
      salonId: body.salonId,
      step: stepMap[body.currentStep || 0] || 'BUSINESS',
      completed: body.currentStep === 3,
      selectedPlanId: body.selectedPlanId || null,
    };

    // Only include businessData if it exists
    if (body.businessData) {
      mappedBody.businessData = body.businessData;
    }

    const backendUrl = `${BACKEND_URL}/onboarding`;

    console.log("Calling business service:", backendUrl);
    console.log("Request body:", JSON.stringify(mappedBody, null, 2));

    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(mappedBody),
    });

    console.log("Business service status:", response.status);

    const rawResponse = await response.text();

    console.log("Raw save onboarding response:", rawResponse || "[empty]");

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to save onboarding progress",
      };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to save onboarding progress",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Save onboarding API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}