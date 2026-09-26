import 'server-only';

// lib/guest/server/menu.ts
// Wraps M1's modules/menu/queries.listPublicMenu() with the guest view model and the hotel's
// category order. MenuItemSchema (M1-owned) doesn't type `featured` yet, though the seed data
// carries it — see docs/m2/10 for the contract note.

import { listPublicMenu } from '@/modules/menu/queries';
import { GUEST_HOTELS_SEED } from '@/db/seed/guest/guest_seed';
import type { MenuItemVM } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getHotelMenu(hotelId: string): Promise<MenuItemVM[]> {
  const hotel = GUEST_HOTELS_SEED.find((h) => h.id === hotelId);
  const { items } = await listPublicMenu({ hotelId });

  const vm: MenuItemVM[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    categorySlug: slugify(item.category),
    pricePaise: item.price_paise,
    currency: hotel?.currency ?? 'INR',
    imageUrl: item.image_url,
    isVeg: item.is_veg,
    allergens: item.allergen_tags,
    available: item.is_available,
    featured: (item as { featured?: boolean }).featured ?? false,
  }));

  const order = hotel?.category_order;
  if (order) {
    vm.sort((a, b) => {
      const ai = order.indexOf(a.category);
      const bi = order.indexOf(b.category);
      return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    });
  }

  return vm;
}
