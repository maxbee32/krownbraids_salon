// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://5783-82-36-98-104.ngrok-free.app";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const filePath = path.join("/");
    const url = `${BACKEND_URL}/uploads/${filePath}`;

    console.log("Proxying image:", url);

    const backendResponse = await fetch(url, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      console.error("Image fetch failed:", backendResponse.status, url);
      return new NextResponse(null, { status: backendResponse.status });
    }

    const contentType =
      backendResponse.headers.get("content-type") || "application/octet-stream";
    const buffer = await backendResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse(null, { status: 500 });
  }
}