// app/api/auth/services/with-images/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://f6f8-82-36-98-104.ngrok-free.app/servicesservice/api/v1/auth/services";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Create Service API Route (With Images) ===");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json(
        { message: "Salon ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // ✅ Extract service data
    let serviceJson: any;
    const serviceData = formData.get("service");
    
    if (serviceData instanceof Blob) {
      const text = await serviceData.text();
      serviceJson = JSON.parse(text);
    } else if (typeof serviceData === "string") {
      serviceJson = JSON.parse(serviceData);
    } else {
      // Fallback: build from individual fields
      serviceJson = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || "",
        category: formData.get("category") as string,
        amount: parseFloat(formData.get("amount") as string),
        durationMinutes: parseInt(formData.get("durationMinutes") as string),
        duration: `${parseInt(formData.get("durationMinutes") as string)} mins`,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        availability: formData.get("availability") as string || "Available",
        isFeatured: formData.get("isFeatured") === "true",
        requiresBooking: formData.get("requiresBooking") !== "false",
        tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [],
        termsAndConditions: formData.get("termsAndConditions") as string || "",
      };
    }

    // ✅ Get images - using for...of with proper typing
    const images: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key === "images" && value instanceof File) {
        images.push(value);
      }
    }

    console.log("Service payload:", serviceJson);
    console.log("Images:", images.length);

    const backendFormData = new FormData();
    const serviceBlob = new Blob([JSON.stringify(serviceJson)], {
      type: 'application/json'
    });
    backendFormData.append("service", serviceBlob, "service.json");
    
    images.forEach((image) => {
      backendFormData.append("images", image);
    });

    const backendUrl = `${BACKEND_URL}/salon/${salonId}/with-images`;
    console.log("Calling backend:", backendUrl);

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: backendFormData,
    });

    const rawResponse = await backendResponse.text();
    console.log("Raw backend response:", rawResponse);

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch {
      data = rawResponse || "Failed to create service";
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to create service" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Create service API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}