// app/api/auth/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://f6f8-82-36-98-104.ngrok-free.app/servicesservice/api/v1/services";

// =====================================================
// GET CATEGORY BY ID
// GET /api/auth/categories/[id]
// =====================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await the params (Next.js 15+)
    const params = await context.params;
    const categoryId = params.id;
    
    console.log("=== Get Category by ID API Route ===");
    console.log("Category ID:", categoryId);

    // Get the authorization token from the request headers
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          message: "Unauthorized: No token provided",
          error: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!categoryId) {
      return NextResponse.json(
        {
          message: "Category ID is required",
          error: "MISSING_ID"
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/categories/${categoryId}`;
    console.log("Calling backend:", backendUrl);

    // Call Spring Boot backend
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    console.log("Backend response status:", backendResponse.status);

    // Read backend response
    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message: rawResponse || "Failed to fetch category",
      };
    }

    // Handle backend error
    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json(
          {
            message: `Category with ID ${categoryId} not found`,
            error: "CATEGORY_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to fetch category",
          error: "FETCH_FAILED",
        },
        {
          status: backendResponse.status,
        }
      );
    }

    // Success - return category
    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Get category by ID API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}