// app/api/hotels/route.ts
// Returns list of all active registered hotel tenants with their active stay context

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { supabaseServer } from '@/server/supabase';

export async function GET() {
  try {
    const { data: sbHotels, error } = await supabaseServer
      .from('hotels')
      .select('id, slug, name, tagline, currency, status')
      .eq('status', 'active');

    if (!error && sbHotels && sbHotels.length > 0) {
      const { data: sbStays } = await supabaseServer
        .from('stays')
        .select('id, hotel_id, stay_token, status, rooms(room_number), guests(name)')
        .eq('status', 'active');

      const hotels = sbHotels.map((h: any) => {
        const stay = sbStays?.find((s: any) => s.hotel_id === h.id);
        return {
          id: h.id,
          slug: h.slug,
          name: h.name,
          tagline: h.tagline,
          currency: h.currency,
          status: h.status,
          activeStay: stay
            ? {
                stayId: stay.id,
                roomNumber: (stay.rooms as any)?.room_number || 'Room 101',
                guestName: (stay.guests as any)?.name || 'Valued Guest',
                stayToken: stay.stay_token,
              }
            : {
                stayId: `stay-${h.id}-1`,
                roomNumber: 'Room 101',
                guestName: 'Valued Guest',
                stayToken: `token_${h.slug}_room_101`,
              },
        };
      });

      return NextResponse.json({ hotels, source: 'supabase' });
    }
  } catch {}

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

  return NextResponse.json({ hotels, source: 'local' });
}
