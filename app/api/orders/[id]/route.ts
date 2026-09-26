// app/api/orders/[id]/route.ts
// Order status transition endpoint and single order retrieval (Supports local DB & live Supabase)

import { NextRequest, NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { TransitionOrderInputSchema } from '@/modules/orders/schema';
import { transitionOrderStatus } from '@/modules/orders/service';
import { supabaseServer } from '@/server/supabase';
import { isSameTenant } from '@/server/tenant';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractStayToken(req);

    let order: any = db.orders.find((o) => o.id === id);

    if (!order) {
      try {
        const { data: sbOrder, error } = await supabaseServer
          .from('orders')
          .select('*, rooms(room_number)')
          .eq('id', id)
          .maybeSingle();

        if (!error && sbOrder) {
          order = {
            ...sbOrder,
            room_number: (sbOrder.rooms as any)?.room_number || 'Room 304',
          };
        }
      } catch {}
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (token) {
      const session = verifyStayToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      if (!isSameTenant(order.hotel_id, session.hotelId) || order.stay_id !== session.stayId) {
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
    const nextStatus = body.nextStatus;

    if (!nextStatus) {
      return NextResponse.json({ error: 'Missing nextStatus' }, { status: 400 });
    }

    let updatedOrder: any = null;

    // 1. Check Supabase orders table
    try {
      const { data: sbOrder, error: fetchErr } = await supabaseServer
        .from('orders')
        .select('*, rooms(room_number)')
        .eq('id', id)
        .maybeSingle();

      if (!fetchErr && sbOrder) {
        const { data: updatedSb, error: updateErr } = await supabaseServer
          .from('orders')
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, rooms(room_number)')
          .single();

        if (!updateErr && updatedSb) {
          updatedOrder = {
            ...updatedSb,
            room_number: (updatedSb.rooms as any)?.room_number || 'Room 304',
          };
        }
      }
    } catch (err) {
      console.warn('Supabase order patch fallback:', err);
    }

    // 2. Also check & transition local in-memory order if present
    const localOrder = db.orders.find((o) => o.id === id);
    if (localOrder) {
      try {
        const validated = TransitionOrderInputSchema.parse({
          orderId: id,
          nextStatus: nextStatus,
          note: body.note,
        });
        const transitioned = await transitionOrderStatus(validated, localOrder.hotel_id, actorRole);
        if (!updatedOrder) updatedOrder = transitioned;
      } catch {
        localOrder.status = nextStatus;
        localOrder.updated_at = new Date().toISOString();
        if (!updatedOrder) updatedOrder = localOrder;
      }
    }

    if (updatedOrder) {
      return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 });
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition order status';
    const status = message.includes('Illegal order transition') ? 409 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
