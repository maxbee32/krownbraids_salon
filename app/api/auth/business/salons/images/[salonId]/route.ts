// app/api/auth/business/salons/images/[salonId]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://7257-82-36-98-104.ngrok-free.app/bservice";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await context.params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const url = `${BACKEND_URL}/api/v1/auth/business/salons/images/${salonId}`;
    console.log("[salon-upload] posting to:", url);

    const backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: backendFormData,
    });

    const rawText = await backendResponse.text();
    console.log("[salon-upload] response:", rawText);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: rawText || "Upload failed" },
        { status: backendResponse.status }
      );
    }

    // Backend returns the URL as plain text
    return NextResponse.json({ url: rawText.trim() });
  } catch (error) {
    console.error("[salon-upload] error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}