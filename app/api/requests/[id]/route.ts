// app/api/requests/[id]/route.ts
// Service request assignment and transition endpoint

import { NextRequest, NextResponse } from 'next/server';
import { TransitionRequestInputSchema } from '@/modules/requests/schema';
import { transitionRequestStatus } from '@/modules/requests/service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const hotelId = req.headers.get('x-hotel-id') || body.hotelId || 'hotel-001';

    const validated = TransitionRequestInputSchema.parse({
      requestId: id,
      nextStatus: body.nextStatus,
      actorId: body.actorId,
      actorName: body.actorName,
    });

    const updated = await transitionRequestStatus(validated, hotelId);
    return NextResponse.json({ success: true, request: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
