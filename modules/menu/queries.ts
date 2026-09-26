// modules/menu/queries.ts
// Menu read models for guest ordering and staff kitchen reference

import { db } from '@/server/db';
import { MenuFilter, MenuItem } from './schema';

export async function listPublicMenu(filter: MenuFilter): Promise<{
  hotelId: string;
  categories: string[];
  items: MenuItem[];
}> {
  let items = db.getMenu(filter.hotelId);

  if (filter.category) {
    items = items.filter((i) => i.category.toLowerCase() === filter.category?.toLowerCase());
  }
  if (filter.vegOnly) {
    items = items.filter((i) => i.is_veg);
  }

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return {
    hotelId: filter.hotelId,
    categories,
    items,
  };
}

export async function getMenuItem(itemId: string, hotelId: string): Promise<MenuItem | null> {
  const items = db.getMenu(hotelId);
  return items.find((i) => i.id === itemId) || null;
}
