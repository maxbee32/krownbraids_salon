// app/api/subscription/plans/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = "https://178e-82-36-98-104.ngrok-free.app/aservice/api/v1/auth/admin/subscription-plans";

export async function GET(request: Request) {
  try {
    console.log("=== Fetch Subscription Plans API Route ===");

    // Get the authorization token from the request header
    const authorization = request.headers.get("authorization");

    // Make the request to the backend
    const response = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization || "",
        // Add this header to bypass ngrok warning page
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
      },
    });

    console.log("Backend plans status:", response.status);

    // Read the response
    const rawResponse = await response.text();
    console.log("Raw backend plans response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = { message: rawResponse };
    }

    // Handle backend error
    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error || "Failed to fetch subscription plans",
          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    // Return the plans data
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Fetch subscription plans API error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}