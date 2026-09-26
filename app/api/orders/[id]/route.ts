// app/api/orders/[id]/route.ts
// Order status transition endpoint and single order retrieval (Contract Request C10)

import { NextRequest, NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { TransitionOrderInputSchema } from '@/modules/orders/schema';
import { transitionOrderStatus } from '@/modules/orders/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractStayToken(req);

    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (token) {
      const session = verifyStayToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      // Ensure guest can only read order from their own stay & hotel
      if (order.hotel_id !== session.hotelId || order.stay_id !== session.stayId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const hotelId = req.headers.get('x-hotel-id') || body.hotelId || 'hotel-001';
    const actorRole = req.headers.get('x-user-role') || body.actorRole || 'kitchen_chef';

    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const validated = TransitionOrderInputSchema.parse({
      orderId: id,
      nextStatus: body.nextStatus,
      note: body.note,
    });

    const updated = await transitionOrderStatus(validated, hotelId, actorRole);
    return NextResponse.json({ success: true, order: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition order status';
    const status = message.includes('Illegal order transition') ? 409 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
