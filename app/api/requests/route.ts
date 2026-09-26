// app/api/requests/route.ts
// Service requests creation and queue querying with automated SLA check

import { NextRequest, NextResponse } from 'next/server';
import { CreateRequestInputSchema } from '@/modules/requests/schema';
import { createServiceRequest } from '@/modules/requests/service';
import { getGuestRequests, getDepartmentRequests } from '@/modules/requests/queries';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validated = CreateRequestInputSchema.parse(rawBody);

    const request = await createServiceRequest(validated);
    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = searchParams.get('stayToken');
  const hotelId = searchParams.get('hotelId');
  const category = searchParams.get('category') as 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance' | undefined;

  try {
    if (stayToken) {
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
