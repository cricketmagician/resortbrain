// app/api/requests/[id]/route.ts
// Service request assignment, status transition, and single request retrieval (Supports local DB & live Supabase)

import { NextRequest, NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { TransitionRequestInputSchema } from '@/modules/requests/schema';
import { transitionRequestStatus } from '@/modules/requests/service';
import { supabaseServer } from '@/server/supabase';
import { isSameTenant } from '@/server/tenant';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = extractStayToken(req);

    let request: any = db.requests.find((r) => r.id === id);

    if (!request) {
      try {
        const { data: sbReq, error } = await supabaseServer
          .from('service_requests')
          .select('*, rooms(room_number)')
          .eq('id', id)
          .maybeSingle();

        if (!error && sbReq) {
          request = {
            ...sbReq,
            room_number: (sbReq.rooms as any)?.room_number || 'Room 101',
          };
        }
      } catch {}
    }

    if (!request) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    if (token) {
      const session = verifyStayToken(token);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      if (!isSameTenant(request.hotel_id, session.hotelId) || request.stay_id !== session.stayId) {
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
    const nextStatus = body.nextStatus || 'completed';

    let updatedRequest: any = null;

    // 1. Try Supabase service_requests
    try {
      const { data: sbReq, error: fetchErr } = await supabaseServer
        .from('service_requests')
        .select('*, rooms(room_number)')
        .eq('id', id)
        .maybeSingle();

      if (!fetchErr && sbReq) {
        const { data: updated, error: updateErr } = await supabaseServer
          .from('service_requests')
          .update({
            status: nextStatus,
            completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', id)
          .select('*, rooms(room_number)')
          .single();

        if (!updateErr && updated) {
          updatedRequest = {
            ...updated,
            room_number: (updated.rooms as any)?.room_number || 'Room 101',
          };
        }
      }
    } catch (err) {
      console.warn('Supabase request patch fallback:', err);
    }

    // 2. Also check & transition local in-memory request if present
    const reqItem = db.requests.find((r) => r.id === id);
    if (reqItem) {
      try {
        const validated = TransitionRequestInputSchema.parse({
          requestId: id,
          nextStatus: nextStatus as any,
          actorId: body.actorId,
          actorName: body.actorName,
        });
        const transitioned = await transitionRequestStatus(validated, reqItem.hotel_id);
        if (!updatedRequest) updatedRequest = transitioned;
      } catch {
        (reqItem as any).status = nextStatus;
        if (!updatedRequest) updatedRequest = reqItem;
      }
    }

    if (updatedRequest) {
      return NextResponse.json({ success: true, request: updatedRequest }, { status: 200 });
    }

    return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to transition request';
    const status = message.includes('Illegal service request transition') ? 409 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
