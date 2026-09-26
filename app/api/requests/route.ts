// app/api/requests/route.ts
// Service requests creation and queue querying with automated SLA check

import { NextRequest, NextResponse } from 'next/server';
import { CreateRequestInputSchema } from '@/modules/requests/schema';
import { createServiceRequest } from '@/modules/requests/service';
import { getGuestRequests, getDepartmentRequests } from '@/modules/requests/queries';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { supabaseServer } from '@/server/supabase';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const token = extractStayToken(req) || rawBody.stayToken;

    if (!token) {
      return NextResponse.json({ error: 'Stay token is required' }, { status: 401 });
    }

    const validated = CreateRequestInputSchema.parse({
      ...rawBody,
      stayToken: token,
    });

    const request = await createServiceRequest(validated);

    // Sync to Supabase in background
    try {
      const targetHotelId = request.hotel_id === 'hotel-001' ? '11111111-1111-1111-1111-111111111111' : request.hotel_id;
      supabaseServer.from('service_requests').insert({
        hotel_id: targetHotelId,
        stay_id: request.stay_id,
        room_id: request.room_id || 'a0000101-0000-0000-0000-000000000101',
        category: request.category,
        title: request.title,
        details: request.details,
        status: request.status,
        priority: request.priority,
        sla_minutes: request.sla_minutes,
      }).then(() => {});
    } catch {}

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    const status = message.includes('Unauthorized') || message.includes('stay token') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = extractStayToken(req, searchParams);
  const hotelId = searchParams.get('hotelId') || req.headers.get('x-hotel-id');
  const category = searchParams.get('category') as 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance' | undefined;

  try {
    if (stayToken) {
      const session = verifyStayToken(stayToken);
      if (!session) {
        return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
      }
      const requests = await getGuestRequests(stayToken);
      return NextResponse.json({ requests });
    }

    if (hotelId) {
      try {
        const targetHId = hotelId === 'hotel-001' ? '11111111-1111-1111-1111-111111111111' : hotelId;
        let query = supabaseServer
          .from('service_requests')
          .select('id, hotel_id, stay_id, room_id, category, title, details, status, priority, sla_minutes, created_at')
          .eq('hotel_id', targetHId)
          .order('created_at', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data: sbRequests, error } = await query;
        if (!error && sbRequests && sbRequests.length > 0) {
          return NextResponse.json({ requests: sbRequests, source: 'supabase' });
        }
      } catch {}

      const requests = await getDepartmentRequests(hotelId, category);
      return NextResponse.json({ requests, source: 'local' });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query service requests';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
