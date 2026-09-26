// modules/stays/service.ts
// Stay session resolution from Room QR code or direct Stay Token

import { createStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { StayTokenSession } from './schema';

export async function resolveSessionFromQR(qrToken: string): Promise<StayTokenSession | null> {
  const stay = db.getStayByRoomQR(qrToken);
  if (!stay) return null;

  const hotel = db.getHotel(stay.hotel_id);
  if (!hotel) return null;

  // Generate short-lived signed stay token if not present
  const token = createStayToken({
    stayId: stay.id,
    hotelId: stay.hotel_id,
    hotelSlug: hotel.slug,
    roomId: stay.room_id,
    roomNumber: stay.room_number,
    guestId: stay.guest_id,
    guestName: stay.guest_name,
    expiresAt: stay.check_out,
  });

  return {
    stayId: stay.id,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    roomId: stay.room_id,
    roomNumber: stay.room_number,
    guestName: stay.guest_name,
    stayToken: token,
    currency: hotel.currency || 'INR',
    taxRate: Number(hotel.tax_rate_percent || 18),
    serviceCharge: Number(hotel.service_charge_percent || 5),
  };
}

export async function resolveSessionFromToken(stayToken: string): Promise<StayTokenSession | null> {
  // First check if it's one of our seeded tokens
  const seededStay = db.getStayByToken(stayToken);
  if (seededStay) {
    const hotel = db.getHotel(seededStay.hotel_id);
    if (!hotel) return null;
    return {
      stayId: seededStay.id,
      hotelId: hotel.id,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      roomId: seededStay.room_id,
      roomNumber: seededStay.room_number,
      guestName: seededStay.guest_name,
      stayToken,
      currency: hotel.currency || 'INR',
      taxRate: Number(hotel.tax_rate_percent || 18),
      serviceCharge: Number(hotel.service_charge_percent || 5),
    };
  }

  // Otherwise verify cryptographically
  const verified = verifyStayToken(stayToken);
  if (!verified) return null;

  const hotel = db.getHotel(verified.hotelId);
  if (!hotel) return null;

  return {
    stayId: verified.stayId,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    roomId: verified.roomId,
    roomNumber: verified.roomNumber,
    guestName: verified.guestName,
    stayToken,
    currency: hotel.currency || 'INR',
    taxRate: Number(hotel.tax_rate_percent || 18),
    serviceCharge: Number(hotel.service_charge_percent || 5),
  };
}
