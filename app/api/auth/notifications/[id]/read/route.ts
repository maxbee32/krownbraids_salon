import { NextResponse } from "next/server";

const BACKEND_URL =
  "https://7257-82-36-98-104.ngrok-free.app/nservice/api/v1/auth/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== Mark Notification Read API Route ===");
    console.log("Notification ID:", params.id);

    const authorization =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json(
        { message: "Authorization token is required" },
        { status: 401 }
      );
    }

    const target = `${BACKEND_URL}/${params.id}/read`;
    console.log("Calling notification service:", target);

    const response = await fetch(target, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    console.log("Notification service status:", response.status);

    // Backend returns 204 No Content on success
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const rawResponse = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse || "Failed to mark as read" };
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string };
      return NextResponse.json(
        {
          message: errObj.message || errObj.error || "Failed to mark as read",
          ...(typeof data === "object" && data !== null ? data : {}),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("Mark notification read API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}