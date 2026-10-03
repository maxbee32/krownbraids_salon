// app/api/auth/marketplace/products/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://58bb-82-36-98-104.ngrok-free.app/supservice/api/v1/auth/marketplace/products";

export async function GET(request: NextRequest) {
  try {
    // Pass through any query params: ?category=..., ?search=..., ?page=..., ?size=...
    const qs = request.nextUrl.searchParams.toString();
    const url = qs ? `${BACKEND_URL}?${qs}` : BACKEND_URL;

    const backendResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    });

    const rawResponse = await backendResponse.text();

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Non-JSON response from marketplace backend:",
        rawResponse.slice(0, 200)
      );
      data = {
        success: false,
        message: "Backend returned non-JSON response",
        data: [],
      };
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Marketplace products proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: [] },
      { status: 500 }
    );
  }
}