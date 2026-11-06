// app/api/auth/services/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://9125-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// GET ALL SERVICES FOR A SALON
// GET /api/auth/services?salonId={salonId}
// =====================================================

export async function GET(request: NextRequest) {
  try {
    console.log("=== Get Services API Route ===");
    console.log("Full URL:", request.url);

    let authHeader = request.headers.get("authorization");
    console.log("Auth header from 'authorization':", authHeader ? "Present" : "Missing");

    if (!authHeader) {
      authHeader = request.headers.get("Authorization");
      console.log("Auth header from 'Authorization':", authHeader ? "Present" : "Missing");
    }

    console.log("All headers:", Object.fromEntries(request.headers));

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid auth header found");
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log("Token extracted:", token.substring(0, 30) + "...");

    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    console.log("Salon ID from query:", salonId);

    if (!salonId) {
      console.log("❌ Salon ID is missing");
      return NextResponse.json(
        { message: "Salon ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/salon/${salonId}`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    console.log("Backend status:", backendResponse.status);

    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to fetch services";
    }

    if (!backendResponse.ok) {
      console.log("❌ Backend returned error:", backendResponse.status);

      if (backendResponse.status === 401 || backendResponse.status === 403) {
        return NextResponse.json(
          { message: "Session expired. Please login again." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { message: data.message || "Failed to fetch services" },
        { status: backendResponse.status }
      );
    }

    console.log("✅ Services fetched successfully");
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error("Get services API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// CREATE A SERVICE (no images)
// POST /api/auth/services?salonId={salonId}
// =====================================================

export async function POST(request: NextRequest) {
  try {
    console.log("=== Create Service API Route (No Images) ===");
    console.log("Full URL:", request.url);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json(
        { message: "Salon ID is required" },
        { status: 400 }
      );
    }

    const body = await request.text();
    console.log("Service payload:", body);

    const backendUrl = `${BACKEND_URL}/salon/${salonId}`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });

    const rawResponse = await backendResponse.text();
    console.log("Backend status:", backendResponse.status);
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to create service";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: (data && data.message) || "Failed to create service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Create service API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}