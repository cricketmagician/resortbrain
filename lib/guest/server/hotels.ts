import 'server-only';

// lib/guest/server/hotels.ts
// Wraps M1's db.getHotel() with a public-only projection, until M1 publishes
// modules/hotels/queries.getPublicHotel() (contract request C1, docs/m2/10 §2). Only this file
// and lib/guest/server/menu.ts may import from @/server or @/db — lib/guest/data/* never does.

import { db } from '@/server/db';
import { GUEST_HOTELS_SEED } from '@/db/seed/guest/guest_seed';
import type { PublicHotel, RequestCategory } from '../types';

type SeedHotel = (typeof GUEST_HOTELS_SEED)[number];

function toPublicHotel(hotel: SeedHotel | null): PublicHotel | null {
  if (!hotel) return null;
  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    shortName: hotel.short_name,
    tagline: hotel.tagline,
    logoUrl: hotel.logo_url,
    bannerUrl: hotel.banner_url,
    accent: hotel.accent,
    currency: hotel.currency,
    timeZone: hotel.time_zone,
    contact: hotel.contact,
    info: {
      wifiName: hotel.info.wifi_name,
      checkoutTime: hotel.info.checkout_time,
      breakfastHours: hotel.info.breakfast_hours,
      poolHours: hotel.info.pool_hours,
      deliveryEstimate: hotel.info.delivery_estimate,
    },
    requestPresets: hotel.request_presets as Record<RequestCategory, { slug: string; label: string }[]>,
  };
}

export function getPublicHotel(slugOrId: string): PublicHotel | null {
  return toPublicHotel(db.getHotel(slugOrId) as SeedHotel | null);
}

export function listHotelSlugs(): string[] {
  return GUEST_HOTELS_SEED.map((hotel) => hotel.slug);
}
