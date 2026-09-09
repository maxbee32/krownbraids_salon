// app/api/auth/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://3555-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// DELETE A SERVICE
// DELETE /api/auth/services/{id}
// =====================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Fixed
) {
  try {
    // ✅ Important: Await params in Next.js 15+
    const params = await context.params;
    const serviceId = params.id;
    
    console.log("=== Delete Service API Route ===");
    console.log("Service ID from params:", serviceId);
    console.log("Full URL:", request.url);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!serviceId || serviceId === 'undefined') {
      console.error("❌ Invalid service ID:", serviceId);
      return NextResponse.json(
        { message: "Valid Service ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/${serviceId}`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Service deleted successfully";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to delete service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      { message: "Service deleted successfully", data: data },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete service API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// UPDATE A SERVICE (PUT)
// PUT /api/auth/services/{id}
// =====================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Fixed
) {
  try {
    const params = await context.params;
    const serviceId = params.id;
    
    console.log("=== Update Service API Route ===");
    console.log("Service ID from params:", serviceId);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!serviceId || serviceId === 'undefined') {
      return NextResponse.json(
        { message: "Valid Service ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Update payload:", body);

    const backendUrl = `${BACKEND_URL}/${serviceId}`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to update service";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to update service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Update service API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// GET A SERVICE BY ID (Public)
// GET /api/auth/services/{id}
// =====================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Fixed
) {
  try {
    const params = await context.params;
    const serviceId = params.id;
    
    console.log("=== Get Service API Route ===");
    console.log("Service ID from params:", serviceId);

    if (!serviceId || serviceId === 'undefined') {
      return NextResponse.json(
        { message: "Valid Service ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/public/${serviceId}`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to fetch service";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Get service API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}