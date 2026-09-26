// app/api/orders/route.ts
// Order placement, simulation, and listing endpoint (Supports Bearer token, headers, and multi-tenant DB)

import { NextRequest, NextResponse } from 'next/server';
import { PlaceOrderInputSchema } from '@/modules/orders/schema';
import { placeOrder } from '@/modules/orders/service';
import { getGuestOrders, getKitchenQueue } from '@/modules/orders/queries';
import { checkRateLimit } from '@/server/rate-limit';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { supabaseServer } from '@/server/supabase';
import { db } from '@/server/db';
import { resolveTenant, isSameTenant } from '@/server/tenant';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`order_${ip}`, 40, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Order rate limit reached. Please wait.' }, { status: 429 });
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    // 1. Staff KDS Ticket Simulation
    if (rawBody.simulate) {
      const hotelId = rawBody.hotelId || 'hotel-001';
      const tenant = resolveTenant(hotelId);
      const simOrder = db.createSimulatedOrder({
        hotelId: tenant.id,
        roomNumber: rawBody.roomNumber,
      });

      // Best effort background sync to Supabase
      try {
        await supabaseServer.from('orders').insert({
          hotel_id: tenant.uuid,
          stay_id: 'c0000101-0000-0000-0000-000000000101',
          room_id: 'a0000101-0000-0000-0000-000000000101',
          order_number: simOrder.order_number,
          status: 'pending',
          items: simOrder.items,
          subtotal_paise: simOrder.subtotal_paise,
          tax_paise: simOrder.tax_paise,
          service_charge_paise: simOrder.service_charge_paise,
          total_paise: simOrder.total_paise,
          special_instructions: simOrder.special_instructions,
        });
      } catch {}

      return NextResponse.json({ success: true, order: simOrder }, { status: 201 });
    }

    // 2. Standard Guest Order
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
      const tenant = resolveTenant(order.hotel_id);
      await supabaseServer.from('orders').insert({
        hotel_id: tenant.uuid,
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
      });
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
      const tenant = resolveTenant(hotelId);
      try {
        const { data: sbOrders, error } = await supabaseServer
          .from('orders')
          .select('id, hotel_id, stay_id, room_id, order_number, status, items, subtotal_paise, tax_paise, service_charge_paise, total_paise, special_instructions, created_at')
          .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`)
          .order('created_at', { ascending: false });

        if (!error && sbOrders && sbOrders.length > 0) {
          const { data: sbRooms } = await supabaseServer
            .from('rooms')
            .select('id, room_number')
            .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`);

          const roomMap = new Map((sbRooms || []).map((r: any) => [r.id, r.room_number]));

          // Also include any local pending simulated orders not yet in Supabase
          const localOnly = db.orders.filter(
            (lo) => isSameTenant(lo.hotel_id, tenant.id) && !sbOrders.some((so: any) => so.order_number === lo.order_number)
          );

          const enriched = [
            ...localOnly,
            ...sbOrders.map((o: any) => ({
              ...o,
              room_number: roomMap.get(o.room_id) || (o.room_id ? 'Room 101' : 'Suite 304'),
            })),
          ];

          return NextResponse.json({ orders: enriched, source: 'supabase' });
        }
      } catch {}

      const orders = await getKitchenQueue(tenant.id);
      return NextResponse.json({ orders, source: 'local' });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query orders';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
