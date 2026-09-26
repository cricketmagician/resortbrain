'use client';

// A non-interactive MenuItemCard for the landing page's showcase sections. MenuItemCard is a
// Client Component, and event handlers created in a Server Component parent can't cross that
// boundary as props — so the no-op handlers live here instead.

import { MenuItemCard, type MenuItemCardData } from '@/components/ui/guest-kit/menu-item-card';

export function StaticMenuItemCard({ item, layout = 'row' }: { item: MenuItemCardData; layout?: 'row' | 'feature' }) {
  return (
    <MenuItemCard
      item={item}
      layout={layout}
      quantity={0}
      canOrder={false}
      onOpen={() => {}}
      onAdd={() => {}}
      onIncrement={() => {}}
      onDecrement={() => {}}
    />
  );
}
