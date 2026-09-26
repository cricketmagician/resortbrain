// app/api/menu/route.ts
// Public cached menu retrieval endpoint

import { NextRequest, NextResponse } from 'next/server';
import { listPublicMenu } from '@/modules/menu/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId') || 'hotel-001';
  const category = searchParams.get('category') || undefined;
  const vegOnly = searchParams.get('vegOnly') === 'true';

  try {
    const result = await listPublicMenu({ hotelId, category, vegOnly });
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
