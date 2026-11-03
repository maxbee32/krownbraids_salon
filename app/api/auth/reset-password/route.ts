import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://5f31-82-36-98-104.ngrok-free.app/sservice/api/v1/auth/salon-owner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/reset-password`, {
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
        { message: data.message || "Failed to reset password" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[reset-password] error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}