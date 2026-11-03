// app/api/auth/marketplace/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BACKEND = "https://9277-82-36-98-104.ngrok-free.app/pservice";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Forward query params: ?status=PAID&page=0&size=20
    const qs = request.nextUrl.searchParams.toString();
    const url = `${PAYMENT_BACKEND}/api/v1/auth/payments/marketplace/orders/me${qs ? `?${qs}` : ""}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[marketplace/orders] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}