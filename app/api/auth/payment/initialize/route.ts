// app/api/payment/initialize/route.ts
import { NextResponse } from "next/server";


const BACKEND_URL =
  "https://178e-82-36-98-104.ngrok-free.app/pservice/api/v1/auth/payment";
export async function POST(request: Request) {
  try {
    console.log("=== Payment Initialize API Route ===");

    // Get authorization token
    const authorization = request.headers.get("authorization");
    
    if (!authorization) {
      return NextResponse.json(
        { 
          success: false,
          message: "Authorization token is required" 
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { salonId, planId } = body;

    console.log("Payment request:", { salonId, planId });

    // Validate required fields
    if (!salonId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Salon ID is required" 
        },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Plan ID is required" 
        },
        { status: 400 }
      );
    }

    // Call Payment Service
    const response = await fetch(`${BACKEND_URL}/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
      },
      body: JSON.stringify({ salonId, planId }),
    });

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
          message: data.message || "Payment initialization failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutId: data.checkoutId,
      redirectUrl: data.redirectUrl,
      message: data.message || "Payment initialized successfully",
    });

  } catch (error) {
    console.error("Payment initialize API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}