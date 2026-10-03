// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://58bb-82-36-98-104.ngrok-free.app/bservice/api/v1/auth/refresh";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { success: false, message: "Non-JSON response" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Refresh proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}