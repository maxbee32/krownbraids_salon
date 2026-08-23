import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handle GET requests (for manual testing)
export async function GET(request: Request) {
  console.log("=== Payment Callback GET Received ===");
  
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  
  console.log("🔍 GET params:", params);
  
  // Extract parameters
  const checkoutId = params.checkoutId || params.id;
  const status = params.status;
  const salonId = params.salonId;
  const planId = params.planId;
  
  // Build redirect URL to the callback page
  const redirectParams = new URLSearchParams();
  if (checkoutId) redirectParams.append('checkoutId', checkoutId);
  if (status) redirectParams.append('status', status);
  if (salonId) redirectParams.append('salonId', salonId);
  if (planId) redirectParams.append('planId', planId);
  
  const redirectUrl = `/dashboard/setup/payment-callback?${redirectParams.toString()}`;
  console.log(`🔀 Redirecting to: ${redirectUrl}`);
  
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

// Handle POST requests (from SumUp)
export async function POST(request: Request) {
  try {
    console.log("=== Payment Callback POST Received ===");
    
    // Get the raw body
    const body = await request.text();
    console.log("📥 Raw callback body:", body);
    
    let data: Record<string, string> = {};
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(body);
      data = jsonData;
      console.log("📥 Parsed as JSON:", data);
    } catch {
      // Try as form data
      try {
        const formData = new URLSearchParams(body);
        formData.forEach((value, key) => {
          data[key] = value;
        });
        console.log("📥 Parsed as FormData:", data);
      } catch {
        console.error("Failed to parse body:", body);
        // Try to extract from URL if it's a redirect with query params
        if (body.includes('checkoutId=') || body.includes('id=')) {
          const params = new URLSearchParams(body);
          params.forEach((value, key) => {
            data[key] = value;
          });
        }
      }
    }
    
    // Extract checkout ID from various possible keys
    const checkoutId = data.checkoutId || data.id || data.checkout_id || data.checkout_ref || data.checkoutReference || data.checkout;
    const status = data.status || data.payment_status || data.state || data.transaction_status;
    const salonId = data.salonId || data.salon_id || data.merchant_reference;
    const planId = data.planId || data.plan_id;
    
    console.log(`🔍 Extracted - Checkout ID: ${checkoutId}, Status: ${status}`);
    
    // Build redirect URL with query parameters
    const params = new URLSearchParams();
    
    if (checkoutId) {
      params.append('checkoutId', String(checkoutId));
    }
    
    if (status) {
      params.append('status', String(status));
    }
    
    if (salonId) {
      params.append('salonId', String(salonId));
    }
    
    if (planId) {
      params.append('planId', String(planId));
    }
    
    // If we have parameters, redirect to the callback page
    if (params.toString()) {
      const redirectUrl = `/dashboard/setup/payment-callback?${params.toString()}`;
      console.log(`🔀 Redirecting to: ${redirectUrl}`);
      
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    
    // If no params, redirect to setup with error
    console.warn("⚠️ No parameters found, redirecting to setup");
    return NextResponse.redirect(new URL('/dashboard/setup?error=no_params', request.url));
    
  } catch (error) {
    console.error("❌ Callback error:", error);
    return NextResponse.redirect(new URL('/dashboard/setup?error=callback_failed', request.url));
  }
}