//api/auth/register/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== Salon Owner Register API Route ===");

    // ==========================================
    // Validate request body
    // ==========================================

    if (
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.phoneNumber ||
      !body.password
    ) {
      return NextResponse.json(
        {
          message:
            "First name, last name, email, phone number and password are required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Backend URL
    // ==========================================

    const backendUrl =
      "https://178e-82-36-98-104.ngrok-free.app/aservice/api/v1/auth/salon-owner/register";

    console.log("Calling backend:", backendUrl);

    // ==========================================
    // Call Spring Boot
    // ==========================================

    const response = await fetch(
      backendUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phoneNumber: body.phoneNumber,
          password: body.password,
        }),
      }
    );

    console.log(
      "Backend register status:",
      response.status
    );

    // ==========================================
    // Read backend response
    // ==========================================

    const rawResponse =
      await response.text();

    console.log(
      "Raw backend response:",
      rawResponse
    );

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = {
        message:
          rawResponse ||
          "Registration successful",
      };
    }

    // ==========================================
    // Handle backend error
    // ==========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            "Registration failed",

          ...data,
        },
        {
          status: response.status,
        }
      );
    }

    // ==========================================
    // Success
    // ==========================================

    return NextResponse.json(
      data,
      {
        status: response.status,
      }
    );

  } catch (error) {

    console.error(
      "Salon owner register API error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}