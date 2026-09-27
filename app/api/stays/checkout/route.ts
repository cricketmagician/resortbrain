// app/api/stays/checkout/route.ts
// Front Desk Guest Check-Out and Room Release (Supports local DB & live Supabase)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { supabaseServer } from '@/server/supabase';
import { resolveTenant } from '@/server/tenant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stayId, roomId, hotelId } = body;

    const targetId = stayId || roomId;
    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'stayId/roomId and hotelId are required.' }, { status: 400 });
    }

    const tenant = resolveTenant(hotelId);
    const result = db.checkOutGuest(targetId, tenant.id);

    // Best-effort background sync to Supabase
    try {
      await supabaseServer
        .from('stays')
        .update({ status: 'checked_out' })
        .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`)
        .or(`id.eq.${targetId},room_id.eq.${targetId}`);

      await supabaseServer
        .from('rooms')
        .update({ status: 'available' })
        .or(`hotel_id.eq.${tenant.uuid},hotel_id.eq.${tenant.id}`)
        .eq('id', targetId);
    } catch (err) {
      console.error(`[stays/checkout] Supabase sync failed for ${targetId}:`, err);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check out guest';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
