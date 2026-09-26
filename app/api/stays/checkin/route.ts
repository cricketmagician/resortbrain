// app/api/stays/checkin/route.ts
// Front Desk Guest Check-In with dynamic 4-digit Stay PIN generation (Supports local DB & live Supabase)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { checkRateLimit } from '@/server/rate-limit';
import { supabaseServer } from '@/server/supabase';
import { resolveTenant } from '@/server/tenant';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`checkin_${ip}`, 30, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { hotelId, roomId, guestName, checkOutDate, customPin } = body;

    if (!hotelId || !roomId || !guestName) {
      return NextResponse.json(
        { error: 'hotelId, roomId, and guestName are required for check-in.' },
        { status: 400 }
      );
    }

    const tenant = resolveTenant(hotelId);

    const result = db.checkInGuest({
      hotelId: tenant.id,
      roomId,
      guestName,
      checkOutDate,
      customPin,
    });

    // Best-effort background sync to Supabase
    try {
      const localRoom = db.rooms.find((r) => r.id === roomId);
      const roomNum = localRoom?.room_number || 'Room 105';
      const { data: sbRooms } = await supabaseServer
        .from('rooms')
        .select('id')
        .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`)
        .eq('room_number', roomNum);

      const targetSbRoomId = sbRooms && sbRooms.length > 0 ? sbRooms[0].id : roomId;

      const { data: guestData } = await supabaseServer
        .from('guests')
        .insert({
          hotel_id: tenant.uuid,
          name: guestName,
        })
        .select('id')
        .single();

      if (guestData?.id) {
        await supabaseServer.from('stays').insert({
          hotel_id: tenant.uuid,
          room_id: targetSbRoomId,
          guest_id: guestData.id,
          status: 'active',
          checkin_pin: result.pin,
          stay_token: result.stay.stay_token,
          check_in: new Date().toISOString(),
          check_out: checkOutDate || new Date(Date.now() + 86400000 * 3).toISOString(),
        });

        await supabaseServer
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', targetSbRoomId);
      }
    } catch (err) {
      console.warn('Supabase check-in sync notice:', err);
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check in guest';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
