// app/api/hotels/route.ts
// Returns list of all active registered hotel tenants

import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
  const hotels = db.hotels.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    tagline: h.tagline,
    currency: h.currency,
    status: h.status,
  }));

  return NextResponse.json({ hotels });
}
