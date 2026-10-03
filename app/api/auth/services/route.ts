// app/api/auth/services/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://58bb-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// GET ALL SERVICES FOR A SALON
// GET /api/auth/services?salonId={salonId}
// =====================================================

export async function GET(request: NextRequest) {
  try {
    console.log("=== Get Services API Route ===");
    console.log("Full URL:", request.url);
    
    // ✅ Try multiple ways to get the token
    let authHeader = request.headers.get("authorization");
    console.log("Auth header from 'authorization':", authHeader ? "Present" : "Missing");
    
    // If not found, try with capital 'A'
    if (!authHeader) {
      authHeader = request.headers.get("Authorization");
      console.log("Auth header from 'Authorization':", authHeader ? "Present" : "Missing");
    }
    
    // Log all headers for debugging
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
    
    // ✅ Get salonId from query params
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

    // ✅ Call the backend with the salonId and Authorization header
    const backendUrl = `${BACKEND_URL}/salon/${salonId}`;
    console.log("Calling backend:", backendUrl);

    // ✅ Try with different header formats
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
      
      // If token is invalid, try to refresh or redirect to login
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