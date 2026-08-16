// app/api/auth/business/salons/add-business/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://178e-82-36-98-104.ngrok-free.app/bservice/api/auth/v1/business/salons";

export async function POST(request: Request) {
  try {
    console.log("=== Create Salon API Route ===");

    const body = await request.json();

    // ==========================================
    // Authorization
    // ==========================================

    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          message: "Authorization token is required",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // Backend URL
    // ==========================================

    const backendUrl = `${BACKEND_URL}/add-business`;

    console.log("Calling business service:", backendUrl);
    console.log("Request body:", body);

    // ==========================================
    // Call Business Service
    // ==========================================

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
      },
      body: JSON.stringify(body),
    });

    console.log("Business service status:", response.status);

    // ==========================================
    // Read Response
    // ==========================================

    const rawResponse = await response.text();

    console.log("Raw response:", rawResponse);

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to create salon",
      };
    }

    // ==========================================
    // Error
    // ==========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to create salon",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    // ==========================================
    // Success
    // ==========================================

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Create salon API error:", error);

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