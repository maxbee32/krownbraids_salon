// app/api/auth/services/[id]/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://3555-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// TOGGLE SERVICE ACTIVE STATUS
// PATCH /api/auth/services/[id]/toggle
// =====================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ Change this line
) {
  try {
    // ✅ In Next.js 15+, you need to await params
    const params = await context.params;
    const serviceId = params.id;
    
    console.log("=== Toggle Service Active Status API Route ===");
    console.log("Service ID from params:", serviceId);
    console.log("Full URL:", request.url);
    console.log("Params object:", params);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // ✅ Validate serviceId
    if (!serviceId || serviceId === 'undefined' || serviceId === '') {
      console.error("❌ Invalid service ID:", serviceId);
      return NextResponse.json(
        { message: "Valid Service ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/${serviceId}/toggle-active`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    const rawResponse = await backendResponse.text();
    console.log("Backend status:", backendResponse.status);
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to toggle service status";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to toggle service status" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Toggle service status API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}