// mock/guest/fixtures.ts
// Typed, read-only fixtures derived from the seed, so mock and api modes always show the same
// hotels, rooms, menus and guests. Money here is still just seed data — the simulator in
// server-sim.ts is the only place allowed to compute totals from it.

import { GUEST_HOTELS_SEED, GUEST_MENU_SEED } from '@/db/seed/guest/guest_seed';
import { OPS_ROOMS_SEED, OPS_STAYS_SEED } from '@/db/seed/ops/ops_seed';
import type { MenuItemVM, PublicHotel, RequestCategory } from '@/lib/guest/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const MOCK_HOTELS: PublicHotel[] = GUEST_HOTELS_SEED.map((hotel) => ({
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
}));

export const MOCK_HOTELS_BY_ID = new Map(MOCK_HOTELS.map((h) => [h.id, h]));
export const MOCK_HOTELS_BY_SLUG = new Map(MOCK_HOTELS.map((h) => [h.slug, h]));

function toMenuItemVM(item: (typeof GUEST_MENU_SEED)[number], currency: string): MenuItemVM {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    categorySlug: slugify(item.category),
    pricePaise: item.price_paise,
    currency,
    imageUrl: item.image_url,
    isVeg: item.is_veg,
    allergens: item.allergen_tags,
    available: item.is_available,
    featured: item.featured,
  };
}

/** Every menu item for a hotel, ordered by the hotel's category_order. */
export function menuForHotel(hotelId: string): MenuItemVM[] {
  const hotel = GUEST_HOTELS_SEED.find((h) => h.id === hotelId);
  const items = GUEST_MENU_SEED.filter((i) => i.hotel_id === hotelId).map((item) => toMenuItemVM(item, hotel?.currency ?? 'INR'));
  const order = hotel?.category_order;
  if (order) {
    items.sort((a, b) => {
      const ai = order.indexOf(a.category);
      const bi = order.indexOf(b.category);
      return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    });
  }
  return items;
}

export function menuItem(hotelId: string, menuItemId: string) {
  return GUEST_MENU_SEED.find((i) => i.hotel_id === hotelId && i.id === menuItemId) ?? null;
}

export interface MockRoom {
  id: string;
  hotelId: string;
  roomNumber: string;
  qrToken: string;
  status: string;
}

export const MOCK_ROOMS: MockRoom[] = OPS_ROOMS_SEED.map((room) => ({
  id: room.id,
  hotelId: room.hotel_id,
  roomNumber: room.room_number,
  qrToken: room.qr_code_token,
  status: room.status,
}));

export interface MockStay {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  status: string;
}

export const MOCK_STAYS: MockStay[] = OPS_STAYS_SEED.map((stay) => ({
  id: stay.id,
  hotelId: stay.hotel_id,
  roomId: stay.room_id,
  roomNumber: stay.room_number,
  guestName: stay.guest_name,
  status: stay.status,
}));

export function findStayByQrToken(qrToken: string): MockStay | null {
  const room = MOCK_ROOMS.find((r) => r.qrToken === qrToken);
  if (!room) return null;
  return MOCK_STAYS.find((s) => s.roomId === room.id && s.status === 'active') ?? null;
}

export function findStayById(stayId: string): MockStay | null {
  return MOCK_STAYS.find((s) => s.id === stayId && s.status === 'active') ?? null;
}
