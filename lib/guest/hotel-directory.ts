// lib/guest/hotel-directory.ts
// Maps hotelId -> slug so the QR/session flow can redirect to /h/{slug} without depending on
// M1 shipping hotelSlug on StayTokenSession. Generated from the guest seed and superseded once
// contract request C2 lands (docs/m2/10 §2).

import { GUEST_HOTELS_SEED } from '@/db/seed/guest/guest_seed';

export const HOTEL_DIRECTORY: Record<string, string> = Object.fromEntries(
  GUEST_HOTELS_SEED.map((hotel) => [hotel.id, hotel.slug])
);

export function hotelIdToSlug(hotelId: string): string | undefined {
  return HOTEL_DIRECTORY[hotelId];
}
