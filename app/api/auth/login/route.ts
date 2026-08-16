// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://178e-82-36-98-104.ngrok-free.app/aservice/api/v1/auth/salon-owner";

// =====================================================
// SALON OWNER LOGIN
// POST /api/auth/login
// =====================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== Salon Owner Login API Route ===");
    console.log("Login attempt for email:", body.email);

    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          message: "Email and password are required",
        },
        {
          status: 400,
        }
      );
    }

    // Backend URL
    const backendUrl = `${BACKEND_URL}/login`;

    console.log("Calling backend:", backendUrl);

    // Call Spring Boot
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    console.log("Backend login status:", backendResponse.status);

    // Read backend response
    const rawResponse = await backendResponse.text();
    console.log("Raw backend login response:", rawResponse);

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Login failed",
      };
    }

    // Handle backend error
    if (!backendResponse.ok) {
      // Check for specific error types
      if (backendResponse.status === 401) {
        return NextResponse.json(
          {
            message: data.message || "Invalid email or password",
            error: "INVALID_CREDENTIALS",
            ...data,
          },
          {
            status: 401,
          }
        );
      }

      if (backendResponse.status === 403) {
        // User might be inactive or not verified
        if (data.message?.toLowerCase().includes('inactive')) {
          return NextResponse.json(
            {
              message: "Your account is inactive. Please contact support.",
              error: "ACCOUNT_INACTIVE",
              ...data,
            },
            {
              status: 403,
            }
          );
        }
        
        return NextResponse.json(
          {
            message: data.message || "Access denied",
            ...data,
          },
          {
            status: 403,
          }
        );
      }

      if (backendResponse.status === 404) {
        return NextResponse.json(
          {
            message: "Account not found. Please register first.",
            error: "ACCOUNT_NOT_FOUND",
            ...data,
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json(
        {
          message: data.message || data.error || "Login failed",
          ...data,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    // Success - return data
    // Expected response structure from Spring Boot:
    // {
    //   token: "jwt_token",
    //   message: "Login successful.",
    //   salonOwnerId: 1,
    //   roleName: "SALON_OWNER"
    // }
    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Login API error:", error);

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