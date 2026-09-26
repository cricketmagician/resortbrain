// app/api/orders/route.ts
// Order placement and listing endpoint (Supports Bearer token and headers)

import { NextRequest, NextResponse } from 'next/server';
import { PlaceOrderInputSchema } from '@/modules/orders/schema';
import { placeOrder } from '@/modules/orders/service';
import { getGuestOrders, getKitchenQueue } from '@/modules/orders/queries';
import { checkRateLimit } from '@/server/rate-limit';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { supabaseServer } from '@/server/supabase';

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

    // Sync to Supabase in background
    try {
      const targetHotelId = order.hotel_id === 'hotel-001' ? '11111111-1111-1111-1111-111111111111' : order.hotel_id;
      supabaseServer.from('orders').insert({
        hotel_id: targetHotelId,
        stay_id: order.stay_id,
        room_id: order.room_id || 'a0000101-0000-0000-0000-000000000101',
        order_number: order.order_number,
        status: order.status,
        items: order.items,
        subtotal_paise: order.subtotal_paise,
        tax_paise: order.tax_paise,
        service_charge_paise: order.service_charge_paise,
        total_paise: order.total_paise,
        special_instructions: order.special_instructions,
        idempotency_key: order.idempotency_key,
      }).then(() => {});
    } catch {}

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
      try {
        const targetHId = hotelId === 'hotel-001' ? '11111111-1111-1111-1111-111111111111' : hotelId;
        const { data: sbOrders, error } = await supabaseServer
          .from('orders')
          .select('id, hotel_id, stay_id, room_id, order_number, status, items, subtotal_paise, tax_paise, service_charge_paise, total_paise, special_instructions, created_at')
          .eq('hotel_id', targetHId)
          .order('created_at', { ascending: false });

        if (!error && sbOrders && sbOrders.length > 0) {
          return NextResponse.json({ orders: sbOrders, source: 'supabase' });
        }
      } catch {}

      const orders = await getKitchenQueue(hotelId);
      return NextResponse.json({ orders, source: 'local' });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query orders';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
