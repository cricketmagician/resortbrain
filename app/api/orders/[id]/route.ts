// app/api/orders/[id]/route.ts
// Order status transition endpoint for kitchen staff and runners

import { NextRequest, NextResponse } from 'next/server';
import { TransitionOrderInputSchema } from '@/modules/orders/schema';
import { transitionOrderStatus } from '@/modules/orders/service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const hotelId = req.headers.get('x-hotel-id') || body.hotelId || 'hotel-001';
    const actorRole = req.headers.get('x-user-role') || body.actorRole || 'kitchen_chef';

    const validated = TransitionOrderInputSchema.parse({
      orderId: id,
      nextStatus: body.nextStatus,
      note: body.note,
    });

    const updated = await transitionOrderStatus(validated, hotelId, actorRole);
    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition order status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
