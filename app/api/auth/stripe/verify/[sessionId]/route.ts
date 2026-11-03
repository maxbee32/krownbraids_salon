// app/api/auth/stripe/verify/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BACKEND = "https://5f31-82-36-98-104.ngrok-free.app/pservice";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const res = await fetch(
    `${PAYMENT_BACKEND}/api/v1/auth/stripe/verify/${sessionId}`,
    { headers: { "ngrok-skip-browser-warning": "true" } }
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}