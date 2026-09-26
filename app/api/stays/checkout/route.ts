// app/api/stays/checkout/route.ts
// Front Desk Guest Check-Out and Room Release
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stayId, roomId, hotelId } = body;

    const targetId = stayId || roomId;
    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'stayId/roomId and hotelId are required.' }, { status: 400 });
    }

    const result = db.checkOutGuest(targetId, hotelId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check out guest';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
