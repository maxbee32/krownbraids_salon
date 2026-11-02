// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.SUPPLIER_SERVICE_URL ||
  "https://4ef0-82-36-98-104.ngrok-free.app/supservice";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const joined = path.join("/");

    // Build the list of candidate URLs the backend might serve from.
    // The supplier service saves to `uploads/products/{supplierId}/{file}`
    // and its resource handler may be mapped either way:
    //   /api/v1/auth/images/suppliers/products/{supplierId}/{file}   (with prefix)
    //   /api/v1/auth/images/suppliers/{supplierId}/{file}             (without)
    const candidates: string[] = [];

    if (joined.startsWith("products/")) {
      // path = ["products", supplierId, file]
      candidates.push(
        `${BACKEND_URL}/api/v1/auth/images/suppliers/${joined}`
      );
    } else {
      // path = [supplierId, file]
      candidates.push(
        `${BACKEND_URL}/api/v1/auth/images/suppliers/products/${joined}`,
        `${BACKEND_URL}/api/v1/auth/images/suppliers/${joined}`
      );
    }

    for (const url of candidates) {
      console.log("[img] trying:", url);

      const backendResponse = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "krownbraids-server/1.0",
          Accept: "image/*,*/*",
        },
        cache: "no-store",
      });

      console.log("[img] upstream status:", backendResponse.status, url);

      if (!backendResponse.ok) {
        console.warn("[img] miss:", backendResponse.status, url);
        continue;
      }

      const contentType =
        backendResponse.headers.get("content-type") || "image/jpeg";
      const buffer = await backendResponse.arrayBuffer();

      console.log("[img] ✅ hit:", url, `(${buffer.byteLength} bytes)`);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, immutable",
        },
      });
    }

    console.error("[img] all candidates failed for path:", joined);
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error("[img] proxy error:", error);
    return new NextResponse(null, { status: 500 });
  }
}