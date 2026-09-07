// app/api/auth/payment/verify/[checkoutId]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = "https://f6f8-82-36-98-104.ngrok-free.app/pservice/api/v1/auth/payment/";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkoutId: string }> }
) {
  try {
    console.log("=== Payment Verify API Route ===");

    const { checkoutId } = await params;

    if (!checkoutId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Checkout ID is required" 
        },
        { status: 400 }
      );
    }

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

    console.log("Verifying payment for checkout:", checkoutId);

    const response = await fetch(`${BACKEND_URL}/verify/${checkoutId}`, {
      method: "GET",
      headers: {
        "Authorization": authorization,
      },
    });

    const rawResponse = await response.text();
    console.log("Payment verification response:", rawResponse);

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
          message: data.message || "Payment verification failed",
        },
        { status: response.status }
      );
    }

    // 🔥 Check if payment was successful
    const isPaid = data.status === 'SUCCESS' || 
                   data.status === 'PAID' || 
                   data.status === 'success' || 
                   data.status === 'PAYMENT_RECEIVED' ||
                   data.status === 'COMPLETED';

    return NextResponse.json({
      success: true,
      status: data.status,
      paid: isPaid,  // 🔥 Add this field for easy checking
      message: data.message || "Payment verified successfully",
    });

  } catch (error) {
    console.error("Payment verify API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}