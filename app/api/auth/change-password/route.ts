import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://4ef0-82-36-98-104.ngrok-free.app/sservice/api/v1/auth/salon-owner";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText || "Password change failed" };
    }

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to change password" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[change-password] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}