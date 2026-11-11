import { NextRequest, NextResponse } from 'next/server';

const BUSINESS_URL =
  process.env.BUSINESS_SERVICE_URL ||
  'https://60a6-82-36-98-104.ngrok-free.app/bservice';

const PAYMENT_URL =
  process.env.PAYMENT_SERVICE_URL ||
  'https://60a6-82-36-98-104.ngrok-free.app/pservice';

const INTERNAL_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-super-secret-token';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const range = req.nextUrl.searchParams.get('range') ?? '30d';

    // ─── 1. Resolve the salon ID for the authenticated owner ───
    const salonRes = await fetch(
      `${BUSINESS_URL}/api/v1/auth/business/salons/onboarding`,
      {
        headers: {
          Authorization: auth,
          'ngrok-skip-browser-warning': 'true',
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!salonRes.ok) {
      const text = await salonRes.text();
      console.error(
        '[revenue] onboarding failed:',
        salonRes.status,
        text.slice(0, 200)
      );
      return NextResponse.json(
        { error: 'Could not resolve salon', status: salonRes.status },
        { status: 502 }
      );
    }

    const salonData = await salonRes.json();
    const salonId = salonData.salonId || salonData.id;
    if (!salonId) {
      return NextResponse.json({ error: 'No salon found' }, { status: 404 });
    }

    // ─── 2. Fetch revenue from payment-service (internal) ───
    const revRes = await fetch(
      `${PAYMENT_URL}/api/v1/internal/payments/salon/${salonId}/revenue?range=${encodeURIComponent(range)}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'X-Internal-Token': INTERNAL_TOKEN,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const text = await revRes.text();
    const contentType = revRes.headers.get('content-type') ?? '';

    if (text.length === 0) {
      return NextResponse.json(
        { error: 'Empty response from payment service' },
        { status: 502 }
      );
    }

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Non-JSON from payment service', raw: text.slice(0, 300) },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: revRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenue] proxy failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy failed' },
      { status: 502 }
    );
  }
}