'use client';

import { useGuestSession } from '@/lib/guest/session';
import { useCart } from '@/lib/guest/cart';
import { ItemDetail } from './item-detail';
import type { MenuItemVM, PublicHotel } from '@/lib/guest/types';

// Wires session + cart for the standalone item page (the sheet on /menu wires them itself, since
// it already has both in scope from MenuList).
export function ItemDetailContainer({ hotel, item }: { hotel: PublicHotel; item: MenuItemVM }) {
  const session = useGuestSession(hotel.id);
  const cart = useCart(session?.stayId ?? null);
  const line = cart.lines.find((l) => l.menuItemId === item.id);

  return (
    <ItemDetail
      item={item}
      quantity={line?.quantity ?? 0}
      canOrder={!!session}
      note={line?.note ?? ''}
      onAdd={() => cart.add(item.id)}
      onChange={(qty) => cart.setQty(item.id, qty)}
      onNoteChange={(note) => cart.setItemNote(item.id, note)}
    />
  );
}
