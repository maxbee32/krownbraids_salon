// app/api/auth/cat/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://58bb-82-36-98-104.ngrok-free.app/supservice/api/v1/auth/categories";

export async function GET() {
  try {
    const backendResponse = await fetch(BACKEND_URL, {
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
        "Non-JSON response from backend:",
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
    console.error("Get categories API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: [] },
      { status: 500 }
    );
  }
}