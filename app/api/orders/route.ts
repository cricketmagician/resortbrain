// app/api/orders/route.ts
// Order placement and listing endpoint

import { NextRequest, NextResponse } from 'next/server';
import { PlaceOrderInputSchema } from '@/modules/orders/schema';
import { placeOrder } from '@/modules/orders/service';
import { getGuestOrders, getKitchenQueue } from '@/modules/orders/queries';
import { checkRateLimit } from '@/server/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`order_${ip}`, 20, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Order rate limit reached. Please wait.' }, { status: 429 });
  }

  try {
    const rawBody = await req.json();
    const validated = PlaceOrderInputSchema.parse(rawBody);

    const order = await placeOrder(validated);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid order payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = searchParams.get('stayToken');
  const hotelId = searchParams.get('hotelId');

  try {
    if (stayToken) {
      const orders = await getGuestOrders(stayToken);
      return NextResponse.json({ orders });
    }

    if (hotelId) {
      const orders = await getKitchenQueue(hotelId);
      return NextResponse.json({ orders });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId query parameter.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query orders';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
