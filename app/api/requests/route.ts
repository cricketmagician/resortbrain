// app/api/requests/route.ts
// Service requests creation and queue querying with automated SLA check

import { NextRequest, NextResponse } from 'next/server';
import { CreateRequestInputSchema } from '@/modules/requests/schema';
import { createServiceRequest } from '@/modules/requests/service';
import { getGuestRequests, getDepartmentRequests } from '@/modules/requests/queries';
import { extractStayToken, verifyStayToken } from '@/server/auth';

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
      const requests = await getDepartmentRequests(hotelId, category);
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ error: 'Missing stayToken or hotelId.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query service requests';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
