'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MenuItemCard } from '@/components/ui/guest-kit/menu-item-card';
import { useGuestSession } from '@/lib/guest/session';
import { useCart } from '@/lib/guest/cart';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { MenuItemVM, PublicHotel } from '@/lib/guest/types';

export function ChefsPicks({ hotel, items }: { hotel: PublicHotel; items: MenuItemVM[] }) {
  const router = useRouter();
  const session = useGuestSession(hotel.id);
  const cart = useCart(session?.stayId ?? null);

  if (items.length === 0) return null;

  function quantityFor(id: string): number {
    return cart.lines.find((l) => l.menuItemId === id)?.quantity ?? 0;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">{GUEST_COPY.home.chefsPicks}</h2>
        <Link href={`/h/${hotel.slug}/menu`} className="rounded text-sm font-medium text-accent focus-ring">
          All ›
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          <div key={item.id} className="w-60 shrink-0 snap-start">
            <MenuItemCard
              item={item}
              layout="feature"
              quantity={quantityFor(item.id)}
              canOrder={!!session}
              onOpen={() => router.push(`/h/${hotel.slug}/menu/${item.id}`)}
              onAdd={() => cart.add(item.id)}
              onIncrement={() => cart.setQty(item.id, quantityFor(item.id) + 1)}
              onDecrement={() => cart.setQty(item.id, quantityFor(item.id) - 1)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
