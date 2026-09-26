// app/api/hotels/[slugOrId]/route.ts
// Public Hotel Details endpoint for Guest PWA and Landing pages

import { NextResponse } from 'next/server';
import { getPublicHotel } from '@/modules/hotels/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slugOrId: string }> }
) {
  const { slugOrId } = await params;
  const hotel = getPublicHotel(slugOrId);

  if (!hotel) {
    return NextResponse.json({ error: 'Hotel tenant not found' }, { status: 404 });
  }

  return NextResponse.json({ hotel });
}
