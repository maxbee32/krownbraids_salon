import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BOOKING_SERVICE_URL ||
  'https://60a6-82-36-98-104.ngrok-free.app/bookingservice';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ message: 'Invalid booking id' }, { status: 400 });
    }

    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const status = req.nextUrl.searchParams.get('status') ?? '';
    if (!status) {
      return NextResponse.json({ message: 'Missing status' }, { status: 400 });
    }

    const upstream = await fetch(
      `${BACKEND_URL}/api/v1/auth/bookings/salon/${id}/status?status=${status}`,
      {
        method: 'PATCH',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: auth,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const text = await upstream.text();
    const ct = upstream.headers.get('content-type') ?? '';

    if (text.length === 0) {
      return NextResponse.json({ ok: upstream.ok }, { status: upstream.status });
    }
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Backend sent non-JSON' }, { status: 502 });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 502 });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[salon booking status] proxy failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy failed' },
      { status: 502 }
    );
  }
}