import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://5f31-82-36-98-104.ngrok-free.app/nservice/api/v1/auth/notifications";

export async function PATCH(request: Request) {
  try {
    console.log("=== Mark All Notifications Read API Route ===");

    const authorization =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const target = `${BACKEND_URL}/read-all`;
    console.log("Calling notification service:", target);

    const response = await fetch(target, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    console.log("Notification service status:", response.status);

    const rawResponse = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse || "Failed to mark all as read" };
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string };
      return NextResponse.json(
        {
          message:
            errObj.message || errObj.error || "Failed to mark all as read",
          ...(typeof data === "object" && data !== null ? data : {}),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("Mark all read API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}