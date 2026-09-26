// app/api/stays/checkin/route.ts
// Front Desk Guest Check-In with dynamic 4-digit Stay PIN generation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { checkRateLimit } from '@/server/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`checkin_${ip}`, 30, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { hotelId, roomId, guestName, checkOutDate, customPin } = body;

    if (!hotelId || !roomId || !guestName) {
      return NextResponse.json(
        { error: 'hotelId, roomId, and guestName are required for check-in.' },
        { status: 400 }
      );
    }

    const result = db.checkInGuest({
      hotelId,
      roomId,
      guestName,
      checkOutDate,
      customPin,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check in guest';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
