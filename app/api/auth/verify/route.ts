// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://178e-82-36-98-104.ngrok-free.app/aservice/api/v1/auth/salon-owner";

// =====================================================
// VERIFY SALON OWNER EMAIL
// POST /api/auth/verify
// =====================================================

export async function POST(request: Request) {
  try {
    console.log("=== Salon Owner Verify OTP API Route ===");

    // GET JWT FROM FRONTEND
    const authorization = request.headers.get("authorization");

    console.log("Authorization header exists:", !!authorization);
    console.log("Authorization header value:", authorization ? "Bearer [token]" : "None");

    if (!authorization) {
      return NextResponse.json(
        {
          message: "Verification token is required",
        },
        {
          status: 401,
        }
      );
    }

    // GET REQUEST BODY
    const body = await request.json();
    const otp = body.otp?.toString().trim();

    console.log("OTP received:", otp);

    // VALIDATE OTP
    if (!otp) {
      return NextResponse.json(
        {
          message: "OTP is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{4}$/.test(otp)) {
      return NextResponse.json(
        {
          message: "OTP must be a 4-digit number",
        },
        {
          status: 400,
        }
      );
    }

    // BACKEND URL
    const backendUrl = `${BACKEND_URL}/verify-otp`;

    console.log("Calling backend:", backendUrl);

    // Prepare the request body
    const requestBody = {
      otp: otp,
    };

    console.log("Request body:", requestBody);

    // CALL SPRING BOOT
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Backend verify status:", backendResponse.status);

    // READ RESPONSE
    const rawResponse = await backendResponse.text();
    console.log("Raw backend verify response:", rawResponse);

    let data: any;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Verification completed",
      };
    }

    // BACKEND ERROR
    if (!backendResponse.ok) {
      // Check if the error is related to authentication
      if (backendResponse.status === 401 || backendResponse.status === 403) {
        return NextResponse.json(
          {
            message: "Your verification session has expired. Please request a new code.",
            requiresNewToken: true,
          },
          {
            status: backendResponse.status,
          }
        );
      }
      
      return NextResponse.json(
        {
          message: data.message || data.error || "Email verification failed",
          ...data,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    // SUCCESS
    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Verify OTP API error:", error);

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
// RESEND OTP
// PUT /api/auth/verify
// The email is NOT sent from the frontend.
// Spring Boot gets the email from the JWT.
// =====================================================

export async function PUT(request: Request) {
  try {
    console.log("=== Salon Owner Resend OTP API Route ===");

    // GET JWT FROM FRONTEND
    const authorization = request.headers.get("authorization");

    console.log("Authorization header exists:", !!authorization);

    if (!authorization) {
      return NextResponse.json(
        {
          message: "Verification token is required",
        },
        {
          status: 401,
        }
      );
    }

    // BACKEND URL
    const backendUrl = `${BACKEND_URL}/resend-otp`;

    console.log("Calling backend:", backendUrl);

    // CALL SPRING BOOT
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "Accept": "application/json",
      },
    });

    console.log("Backend resend status:", backendResponse.status);

    // READ RESPONSE
    const rawResponse = await backendResponse.text();
    console.log("Raw backend resend response:", rawResponse);

    let data: any;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Verification code sent successfully",
      };
    }

    // BACKEND ERROR
    if (!backendResponse.ok) {
      if (backendResponse.status === 401 || backendResponse.status === 403) {
        return NextResponse.json(
          {
            message: "Your verification session has expired. Please register again.",
            requiresNewToken: true,
          },
          {
            status: backendResponse.status,
          }
        );
      }
      
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to resend verification code",
          ...data,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    // SUCCESS
    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Resend OTP API error:", error);

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