// app/api/orders/quote/route.ts
// Order quote endpoint (Contract Request C3)
// Calculates server-authoritative totals and breakdown with NO side effects

import { NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { QuoteOrderInputSchema } from '@/modules/orders/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = extractStayToken(request) || body.stayToken;

    let targetHotelId: string | undefined = body.hotelId;

    if (token) {
      const session = verifyStayToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      targetHotelId = session.hotelId;
    } else if (body.hotelSlug) {
      const hotel = db.getHotel(body.hotelSlug);
      if (hotel) targetHotelId = hotel.id;
    }

    if (!targetHotelId) {
      return NextResponse.json(
        { error: 'A valid stay token or hotel identifier is required to calculate quote' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items array cannot be empty' }, { status: 400 });
    }

    const quote = db.quoteOrder({
      hotelId: targetHotelId,
      items: body.items,
    });

    return NextResponse.json(quote, { status: 200 });
  } catch (error: any) {
    const message = error.message || 'Failed to calculate quote';
    const status = message.includes('does not exist') || message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
