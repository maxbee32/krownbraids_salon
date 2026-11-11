// app/api/auth/marketplace/orders/[orderNumber]/route.ts
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BACKEND = "https://60a6-82-36-98-104.ngrok-free.app/pservice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(
      `${PAYMENT_BACKEND}/api/v1/auth/payments/marketplace/orders/me/${orderNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[marketplace/orders/detail] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}