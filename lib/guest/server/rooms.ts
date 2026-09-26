import 'server-only';

// lib/guest/server/rooms.ts
// Wraps M3's ops room seed for the one guest-owned screen that needs it: the room QR print sheet
// (docs/m2/02 architecture table, docs/m2/07 §4). Only this file, hotels.ts and menu.ts may import
// from @/server or @/db — the rest of lib/guest/* never does.

import { db } from '@/server/db';

export interface PrintableRoom {
  roomNumber: string;
  qrToken: string;
}

export function getRoomsForHotel(hotelId: string): PrintableRoom[] {
  return db.rooms
    .filter((room) => room.hotel_id === hotelId)
    .map((room) => ({ roomNumber: room.room_number, qrToken: room.qr_code_token }));
}
