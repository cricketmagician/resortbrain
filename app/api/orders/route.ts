// app/api/orders/route.ts
// Order placement and listing endpoint (Supports Bearer token and headers)

import { NextRequest, NextResponse } from 'next/server';
import { PlaceOrderInputSchema } from '@/modules/orders/schema';
import { placeOrder } from '@/modules/orders/service';
import { getGuestOrders, getKitchenQueue } from '@/modules/orders/queries';
import { checkRateLimit } from '@/server/rate-limit';
import { extractStayToken, verifyStayToken } from '@/server/auth';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`order_${ip}`, 20, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Order rate limit reached. Please wait.' }, { status: 429 });
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const token = extractStayToken(req) || rawBody.stayToken;

    if (!token) {
      return NextResponse.json({ error: 'Stay token is required' }, { status: 401 });
    }

    const validated = PlaceOrderInputSchema.parse({
      ...rawBody,
      stayToken: token,
    });

    const order = await placeOrder(validated);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid order payload';
    const status = message.includes('Unauthorized') || message.includes('stay token') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = extractStayToken(req, searchParams);
  const hotelId = searchParams.get('hotelId') || req.headers.get('x-hotel-id');

  try {
    if (stayToken) {
      const session = verifyStayToken(stayToken);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      const orders = await getGuestOrders(stayToken);
      return NextResponse.json({ orders });
    }

    if (hotelId) {
      const orders = await getKitchenQueue(hotelId);
      return NextResponse.json({ orders });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query orders';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
