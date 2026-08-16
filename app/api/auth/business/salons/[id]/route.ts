// app/api/auth/business/salons/[id]/route.ts

import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log(
      "=== Find Salon By ID API Route ==="
    );

    // ==========================================
    // Validate ID
    // ==========================================

    if (!id) {
      return NextResponse.json(
        {
          message: "Salon ID is required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Get Authorization Header
    // ==========================================

    const authorization =
      request.headers.get("Authorization");

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
    // Business Service URL
    // ==========================================

    const backendUrl =
      `https://178e-82-36-98-104.ngrok-free.app/api/v1/business/salons/${id}`;

    console.log(
      "Calling business service:",
      backendUrl
    );

    // ==========================================
    // Call Business Service
    // ==========================================

    const response = await fetch(
      backendUrl,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
          "Authorization": authorization,
        },
      }
    );

    // ==========================================
    // Read Response
    // ==========================================

    const rawResponse =
      await response.text();

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message:
          rawResponse ||
          "Failed to retrieve salon",
      };
    }

    // ==========================================
    // Backend Error
    // ==========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            "Failed to retrieve salon",

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

    return NextResponse.json(
      data,
      {
        status: response.status,
      }
    );

  } catch (error) {

    console.error(
      "Find salon API error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}