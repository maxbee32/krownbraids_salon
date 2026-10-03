// app/api/auth/categories/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://58bb-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// GET CATEGORIES
// GET /api/auth/categories
// =====================================================

export async function GET(request: NextRequest) {
  try {
    console.log("=== Get Categories API Route ===");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get("active");

    let backendUrl;
    if (active === "true") {
      backendUrl = `${BACKEND_URL}/categories/active`;
    } else {
      backendUrl = `${BACKEND_URL}/categories`;
    }

    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
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
      data = rawResponse || "Failed to fetch categories";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch categories" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Get categories API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}