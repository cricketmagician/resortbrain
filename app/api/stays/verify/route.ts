// app/api/stays/verify/route.ts
// Resolves QR code, Room PIN, or Stay Token into guest session
import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromQR, resolveSessionFromToken } from '@/modules/stays/service';
import { db } from '@/server/db';
import { checkRateLimit } from '@/server/rate-limit';
import { supabaseServer } from '@/server/supabase';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`stay_verify_${ip}`, 60, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please retry in a few moments.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { qrToken, stayToken, pin, roomNumber, roomId, hotelId } = body;

    // 1. PIN verification for bedside QR code check-in
    if (pin) {
      try {
        const { data: sbStay, error: sbErr } = await supabaseServer
          .from('stays')
          .select('id, hotel_id, room_id, stay_token, checkin_pin, status, rooms(room_number, room_type), hotels(name, slug, currency, tax_rate_percent, service_charge_percent)')
          .eq('checkin_pin', pin)
          .eq('status', 'active');

        if (!sbErr && sbStay && sbStay.length > 0) {
          const matched = roomNumber
            ? sbStay.find((s: any) => (s.rooms as any)?.room_number?.toLowerCase() === roomNumber.toLowerCase()) || sbStay[0]
            : sbStay[0];

          if (matched) {
            return NextResponse.json({
              success: true,
              session: {
                stayId: matched.id,
                hotelId: matched.hotel_id,
                hotelSlug: (matched.hotels as any)?.slug || 'grand-azure',
                hotelName: (matched.hotels as any)?.name || 'Grand Azure Resort & Spa',
                roomId: matched.room_id,
                roomNumber: (matched.rooms as any)?.room_number || roomNumber || 'Room 101',
                roomType: (matched.rooms as any)?.room_type || 'Villa',
                guestName: 'Kabir Mehta',
                stayToken: matched.stay_token,
                currency: (matched.hotels as any)?.currency || 'INR',
                taxRate: (matched.hotels as any)?.tax_rate_percent || 18,
                serviceCharge: (matched.hotels as any)?.service_charge_percent || 5,
              },
              source: 'supabase',
            });
          }
        }
      } catch {}

      const pinResult = db.verifyStayPin({
        hotelId,
        qrToken,
        roomId,
        roomNumber,
        pin,
      });

      if (!pinResult.success) {
        return NextResponse.json({ error: pinResult.error }, { status: 401 });
      }

      return NextResponse.json({ success: true, session: pinResult.session, source: 'local' });
    }

    // 2. Direct stay token verification
    if (stayToken) {
      const session = await resolveSessionFromToken(stayToken);
      if (session) {
        return NextResponse.json({ success: true, session });
      }
      return NextResponse.json({ error: 'Invalid or expired stay session.' }, { status: 401 });
    }

    // 3. QR token lookup
    if (qrToken) {
      const normalizedQr = qrToken.replace(/^QR_AZURE_/, 'QR_GRAND-AZURE_');
      const aliasQr = qrToken.replace(/^QR_GRAND-AZURE_/, 'QR_AZURE_');

      try {
        const { data: sbRooms, error: roomErr } = await supabaseServer
          .from('rooms')
          .select('id, hotel_id, room_number, room_type, qr_code_token, hotels(name, slug, currency, tax_rate_percent, service_charge_percent)')
          .or(`qr_code_token.eq.${qrToken},qr_code_token.eq.${normalizedQr},qr_code_token.eq.${aliasQr}`);

        if (!roomErr && sbRooms && sbRooms.length > 0) {
          const room = sbRooms[0];
          const { data: sbStays } = await supabaseServer
            .from('stays')
            .select('id, guest_id, stay_token, status, guests(full_name)')
            .eq('room_id', room.id)
            .eq('status', 'active');

          if (sbStays && sbStays.length > 0) {
            const stay = sbStays[0];
            return NextResponse.json({
              success: true,
              session: {
                stayId: stay.id,
                hotelId: room.hotel_id,
                hotelSlug: (room.hotels as any)?.slug || 'grand-azure',
                hotelName: (room.hotels as any)?.name || 'Grand Azure Resort & Spa',
                roomId: room.id,
                roomNumber: room.room_number,
                guestName: (stay.guests as any)?.full_name || 'Dr. Siddharth Verma',
                stayToken: stay.stay_token,
                currency: (room.hotels as any)?.currency || 'INR',
                taxRate: (room.hotels as any)?.tax_rate_percent || 18,
                serviceCharge: (room.hotels as any)?.service_charge_percent || 5,
              },
              source: 'supabase',
            });
          }
        }
      } catch (err) {
        console.warn('Supabase QR verify fallback:', err);
      }

      const session = await resolveSessionFromQR(qrToken);
      if (session) {
        return NextResponse.json({ success: true, session });
      }
      return NextResponse.json({ error: 'Invalid or expired room QR code.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Missing stayToken, qrToken, or PIN.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
