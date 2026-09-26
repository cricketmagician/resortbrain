'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, ConciergeBell, ListChecks, Receipt } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useGuestSession } from '@/lib/guest/session';
import { useOrders, useRequests } from '@/lib/guest/data/hooks';
import { GUEST_TID } from './test-ids';
import type { PublicHotel } from '@/lib/guest/types';

const NAV_ITEMS = [
  { key: 'home', segment: '', icon: Home, label: 'Home' },
  { key: 'menu', segment: 'menu', icon: UtensilsCrossed, label: 'Menu' },
  { key: 'request', segment: 'request', icon: ConciergeBell, label: 'Request' },
  { key: 'activity', segment: 'activity', icon: ListChecks, label: 'Activity' },
  { key: 'bill', segment: 'bill', icon: Receipt, label: 'Bill' },
] as const;

export function BottomNav({ hotel }: { hotel: PublicHotel }) {
  const pathname = usePathname();
  const session = useGuestSession(hotel.id);
  const { data: orders } = useOrders(session);
  const { data: requests } = useRequests(session);

  if (pathname.endsWith('/rejoin')) return null;

  const activeCount =
    (orders?.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length ?? 0) +
    (requests?.filter((r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'rejected').length ?? 0);

  const homeHref = `/h/${hotel.slug}`;

  return (
    <nav aria-label="Guest" className="safe-bottom glass no-print fixed inset-x-0 bottom-0 z-30 border-t border-line">
      <div className="mx-auto flex h-16 max-w-[480px] items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const href = item.segment ? `${homeHref}/${item.segment}` : homeHref;
          const isActive = item.segment ? pathname.startsWith(href) : pathname === homeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              data-testid={GUEST_TID.nav(item.key)}
              className={cn('relative flex flex-1 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-accent' : 'text-ink-subtle')}
            >
              {isActive && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />}
              <span className="relative">
                <Icon aria-hidden className="size-5" strokeWidth={isActive ? 2 : 1.75} />
                {item.key === 'activity' && activeCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink"
                  >
                    {activeCount}
                  </span>
                )}
              </span>
              <span className={isActive ? 'font-semibold' : undefined}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
