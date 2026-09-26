'use client';

// A Server Component page can't pass the SessionGate render-prop function as a prop across the
// RSC boundary, so this small Client Component owns that composition instead (same fix as
// StaticMenuItemCard on the landing page).
import { SessionGate } from './session-gate';
import { CartView } from './cart-view';
import type { MenuItemVM, PublicHotel } from '@/lib/guest/types';

export function CartGate({ hotel, menu }: { hotel: PublicHotel; menu: MenuItemVM[] }) {
  return <SessionGate hotel={hotel}>{(session) => <CartView hotel={hotel} session={session} menu={menu} />}</SessionGate>;
}
