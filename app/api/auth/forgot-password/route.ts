import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://60a6-82-36-98-104.ngrok-free.app/sservice/api/v1/auth/salon-owner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText || "Request failed" };
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to send reset code" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[forgot-password] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}