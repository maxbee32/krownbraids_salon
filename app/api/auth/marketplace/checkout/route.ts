// app/api/auth/marketplace/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BACKEND = "https://4ef0-82-36-98-104.ngrok-free.app/pservice";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(
      `${PAYMENT_BACKEND}/api/v1/auth/payments/marketplace/checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        "[marketplace/checkout] failed",
        res.status,
        JSON.stringify(data).slice(0, 300)
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[marketplace/checkout] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}