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
      `https://4ef0-82-36-98-104.ngrok-free.app/bservice/api/v1/auth/business/salons/${id}`;

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

/* ================================================================== */
/*  PUT — Update salon (profile, hours, notifications, business)       */
/* ================================================================== */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    console.log("=== Update Salon API Route ===");
    console.log("Salon ID:", id);

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { message: "Salon ID is required" },
        { status: 400 }
      );
    }

    // Authorization
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    console.log(
      "Update payload:",
      JSON.stringify(body).slice(0, 500)
    );

    // Business Service URL
    const backendUrl =
      `https://4ef0-82-36-98-104.ngrok-free.app/bservice/api/v1/auth/business/salons/${id}`;

    console.log("Calling business service (PUT):", backendUrl);

    // Call Business Service
    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    // Read response
    const rawResponse = await response.text();

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to update salon",
      };
    }

    // Backend error
    if (!response.ok) {
      console.error(
        "Business service update failed:",
        response.status,
        data
      );

      // Special-case 405 — backend doesn't have @PutMapping
      if (response.status === 405) {
        return NextResponse.json(
          {
            message:
              "The backend does not accept updates for this salon yet. " +
              "Ask the API team to add PUT /salons/{id}.",
          },
          { status: 501 }
        );
      }

      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            "Failed to update salon",
          ...data,
        },
        { status: response.status }
      );
    }

    console.log("✅ Salon updated successfully");

    return NextResponse.json(data, {
      status: response.status,
    });

  } catch (error) {
    console.error("Update salon API error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}