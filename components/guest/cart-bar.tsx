import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { GUEST_TID } from './test-ids';

export function CartBar({ hotelSlug, count }: { hotelSlug: string; count: number }) {
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] z-20 flex justify-center px-4">
      <Link
        href={`/h/${hotelSlug}/cart`}
        data-testid={GUEST_TID.cartBar}
        className="glass pointer-events-auto flex items-center gap-2 rounded-full border border-accent/40 px-5 py-3 text-sm font-semibold text-ink shadow-glow focus-ring"
      >
        <ShoppingBag aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
        {count} {count === 1 ? 'item' : 'items'} · View cart ›
      </Link>
    </div>
  );
}
