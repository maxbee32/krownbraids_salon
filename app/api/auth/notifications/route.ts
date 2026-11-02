import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://4ef0-82-36-98-104.ngrok-free.app/nservice/api/v1/auth/notifications";

export async function GET(request: Request) {
  try {
    console.log("=== List Notifications API Route ===");

    const authorization =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const unread = url.searchParams.get("unread");

    const target = unread
      ? `${BACKEND_URL}?unread=${encodeURIComponent(unread)}`
      : BACKEND_URL;

    console.log("Calling notification service:", target);

    const response = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    console.log("Notification service status:", response.status);

    const rawResponse = await response.text();
    console.log("Raw notifications response:", rawResponse || "[empty]");

    let data: unknown;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse || "Failed to fetch notifications" };
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string };
      return NextResponse.json(
        {
          message:
            errObj.message || errObj.error || "Failed to fetch notifications",
          ...(typeof data === "object" && data !== null ? data : {}),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("List notifications API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}