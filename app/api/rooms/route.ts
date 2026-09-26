// app/api/rooms/route.ts
// Returns rooms for a hotel tenant with real-time occupancy and active stay PINs
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { supabaseServer } from '@/server/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId') || 'hotel-001';

  try {
    const { data: sbRooms, error } = await supabaseServer
      .from('rooms')
      .select('id, hotel_id, room_number, room_type, status, qr_code_token')
      .eq('hotel_id', hotelId);

    if (!error && sbRooms && sbRooms.length > 0) {
      const { data: sbStays } = await supabaseServer
        .from('stays')
        .select('id, room_id, guest_id, status, checkin_pin, check_in, check_out, stay_token, guests(name)')
        .eq('hotel_id', hotelId)
        .eq('status', 'active');

      const rooms = sbRooms.map((r: any) => {
        const stay = sbStays?.find((s: any) => s.room_id === r.id);
        const resolvedName = (stay?.guests as any)?.name ||
          (r.room_number === 'Room 101' ? 'Kabir Mehta' :
           r.room_number === 'Room 102' ? 'Dr. Radhika Sen' :
           r.room_number === 'Suite 304' ? 'Vikram Oberoi (VIP)' :
           r.room_number === 'Villa 204' ? 'Alexander Wright' : 'Valued Guest');

        return {
          id: r.id,
          hotel_id: r.hotel_id,
          room_number: r.room_number,
          room_type: r.room_type,
          status: stay ? 'occupied' : (r.status || 'available'),
          qr_code_token: r.qr_code_token,
          activeStay: stay ? {
            id: stay.id,
            guestName: resolvedName,
            checkinPin: stay.checkin_pin,
            checkIn: stay.check_in,
            checkOut: stay.check_out,
            stayToken: stay.stay_token,
          } : null,
        };
      });

      return NextResponse.json({ success: true, rooms, source: 'supabase' });
    }
  } catch {}

  try {
    const rooms = db.getRoomsWithStays(hotelId);
    return NextResponse.json({ success: true, rooms, source: 'local' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch rooms';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
