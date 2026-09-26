// app/api/requests/[id]/route.ts
// Service request assignment, status transition, and single request retrieval (Contract Request C10)

import { NextRequest, NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { TransitionRequestInputSchema } from '@/modules/requests/schema';
import { transitionRequestStatus } from '@/modules/requests/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractStayToken(req);

    const request = db.requests.find((r) => r.id === id);
    if (!request) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    if (token) {
      const session = verifyStayToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      if (request.hotel_id !== session.hotelId || request.stay_id !== session.stayId) {
        return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ request }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query request';
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

    const reqItem = db.requests.find((r) => r.id === id);
    if (!reqItem) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    const validated = TransitionRequestInputSchema.parse({
      requestId: id,
      nextStatus: body.nextStatus,
      actorId: body.actorId,
      actorName: body.actorName,
    });

    const updated = await transitionRequestStatus(validated, hotelId);
    return NextResponse.json({ success: true, request: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition request';
    const status = message.includes('Illegal service request transition') ? 409 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
