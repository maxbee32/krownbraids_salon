// app/api/auth/services/[id]/with-images/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://5f31-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

// =====================================================
// UPDATE A SERVICE WITH IMAGES
// PUT /api/auth/services/[id]/with-images
// =====================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const serviceId = params.id;

    console.log("=== Update Service With Images API Route ===");
    console.log("Service ID from params:", serviceId);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);

    if (!serviceId || serviceId === "undefined") {
      return NextResponse.json(
        { message: "Valid Service ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Extract the JSON `service` part
    let serviceJson: any;
    const serviceData = formData.get("service");

    if (serviceData instanceof Blob) {
      const text = await serviceData.text();
      serviceJson = JSON.parse(text);
    } else if (typeof serviceData === "string") {
      serviceJson = JSON.parse(serviceData);
    } else {
      serviceJson = {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || "",
        category: formData.get("category") as string,
        amount: parseFloat(formData.get("amount") as string),
        durationMinutes: parseInt(formData.get("durationMinutes") as string),
        duration: `${parseInt(formData.get("durationMinutes") as string)} mins`,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        availability: (formData.get("availability") as string) || "Available",
        isFeatured: formData.get("isFeatured") === "true",
        requiresBooking: formData.get("requiresBooking") !== "false",
        tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [],
        termsAndConditions: (formData.get("termsAndConditions") as string) || "",
      };
    }

    // Collect images
    const images: File[] = [];
    for (const [key, value] of Array.from(formData.entries())) {
      if (key === "images" && value instanceof File) {
        images.push(value);
      }
    }

    console.log("Service payload:", serviceJson);
    console.log("Images:", images.length);

    const backendFormData = new FormData();
    backendFormData.append(
      "service",
      new Blob([JSON.stringify(serviceJson)], { type: "application/json" }),
      "service.json"
    );
    images.forEach((image) => backendFormData.append("images", image));

    const backendUrl = `${BACKEND_URL}/${serviceId}/with-images`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const rawResponse = await backendResponse.text();
    console.log("Backend status:", backendResponse.status);
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to update service";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: (data && data.message) || "Failed to update service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Update service (with images) API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}