// app/api/hotels/route.ts
// Returns list of all active registered hotel tenants with their active stay context

import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
  const hotels = db.hotels.map((h) => {
    const activeStay = db.stays.find((s) => s.hotel_id === h.id && s.status === 'active');
    return {
      id: h.id,
      slug: h.slug,
      name: h.name,
      tagline: h.tagline,
      currency: h.currency,
      status: h.status,
      activeStay: activeStay
        ? {
            stayId: activeStay.id,
            roomNumber: activeStay.room_number,
            guestName: activeStay.guest_name,
            stayToken: activeStay.stay_token,
          }
        : {
            stayId: `stay-${h.id}-1`,
            roomNumber: 'Room 101',
            guestName: 'Valued Guest',
            stayToken: `token_${h.slug}_room_101`,
          },
    };
  });

  return NextResponse.json({ hotels });
}
