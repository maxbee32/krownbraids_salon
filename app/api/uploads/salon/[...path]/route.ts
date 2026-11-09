// app/api/uploads/salon/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BUSINESS_SERVICE_URL ||
  "https://2c9e-82-36-98-104.ngrok-free.app/bservice";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const filePath = path.join("/");

    const url = `${BACKEND_URL}/api/v1/auth/business/salons/images/${filePath}`;
    console.log("[salon-img-proxy] fetching:", url);

    const backendResponse = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true" },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      console.error(
        "[salon-img-proxy] upstream failed:",
        backendResponse.status,
        url
      );
      return new NextResponse(null, { status: backendResponse.status });
    }

    const contentType =
      backendResponse.headers.get("content-type") || "image/jpeg";
    const buffer = await backendResponse.arrayBuffer();

    console.log(
      "[salon-img-proxy] ok:",
      backendResponse.status,
      `${buffer.byteLength} bytes`,
      contentType
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error) {
    console.error("[salon-img-proxy] error:", error);
    return new NextResponse(null, { status: 500 });
  }
}