// app/api/requests/route.ts
// Service requests creation and queue querying with automated SLA check

import { NextRequest, NextResponse } from 'next/server';
import { CreateRequestInputSchema } from '@/modules/requests/schema';
import { createServiceRequest } from '@/modules/requests/service';
import { getGuestRequests, getDepartmentRequests } from '@/modules/requests/queries';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { supabaseServer } from '@/server/supabase';
import { resolveTenant } from '@/server/tenant';
import { sendWebPushNotification } from '@/server/push';

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

    // Send push notification to target department
    try {
      await sendWebPushNotification({
        hotel_id: request.hotel_id,
        department: request.category as any,
        title: `New ${request.category.toUpperCase()} Request: ${request.room_number || 'Room'}`,
        body: `${request.title}${request.details ? ' - ' + request.details : ''}`,
      });
    } catch {}

    // Sync to Supabase in background with safe UUID handling
    try {
      const tenant = resolveTenant(request.hotel_id);
      const targetStayId =
        request.stay_id === 'stay-001' || !request.stay_id.includes('-') || request.stay_id.length < 20
          ? 'c0000101-0000-0000-0000-000000000101'
          : request.stay_id;
      const targetRoomId =
        request.room_id && request.room_id.length > 20
          ? request.room_id
          : 'a0000101-0000-0000-0000-000000000101';

      await supabaseServer.from('service_requests').insert({
        hotel_id: tenant.uuid,
        stay_id: targetStayId,
        room_id: targetRoomId,
        category: request.category,
        title: request.title,
        details: request.details,
        status: request.status,
        priority: request.priority,
        sla_minutes: request.sla_minutes,
      });
    } catch (err) {
      console.warn('Background Supabase sync error for service request:', err);
    }

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
      const localRequests = await getDepartmentRequests(hotelId, category);
      const tenant = resolveTenant(hotelId);

      try {
        let query = supabaseServer
          .from('service_requests')
          .select('id, hotel_id, stay_id, room_id, category, title, details, status, priority, sla_minutes, created_at, rooms(room_number)')
          .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`)
          .order('created_at', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data: sbRequests, error } = await query;
        if (!error && sbRequests && sbRequests.length > 0) {
          const formattedSb = sbRequests.map((r: any) => ({
            ...r,
            room_number: r.rooms?.room_number || (r.room_id ? 'Room 304' : 'Suite 101'),
          }));

          // Local in-memory requests take priority, merged with Supabase history
          const localOnly = localRequests.filter(
            (lr) => !formattedSb.some((sr: any) => sr.id === lr.id || (sr.title === lr.title && sr.status === lr.status))
          );

          const merged = [...localOnly, ...formattedSb];
          return NextResponse.json({ requests: merged, source: 'merged' });
        }
      } catch (err) {
        console.error(`[requests] Supabase read failed for hotel ${tenant.id}, falling back to local store:`, err);
      }

      return NextResponse.json({ requests: localRequests, source: 'local' });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query service requests';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
