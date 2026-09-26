'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useGuestSession } from '@/lib/guest/session';
import { useOrders, useRequests } from '@/lib/guest/data/hooks';
import { ORDER_STATUS, REQUEST_STATUS } from '@/components/ui/tokens/status';
import { GUEST_TID } from './test-ids';

export function ActiveStrip({ hotelId, hotelSlug }: { hotelId: string; hotelSlug: string }) {
  const session = useGuestSession(hotelId);
  const { data: orders } = useOrders(session);
  const { data: requests } = useRequests(session);

  const activeOrder = orders?.find((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const activeRequest = !activeOrder
    ? requests?.find((r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'rejected')
    : undefined;

  if (!activeOrder && !activeRequest) return null;

  const href = activeOrder ? `/h/${hotelSlug}/orders/${activeOrder.id}` : `/h/${hotelSlug}/requests/${activeRequest!.id}`;
  const label = activeOrder
    ? `${ORDER_STATUS[activeOrder.status].guest} · ${activeOrder.orderNumber}`
    : `${REQUEST_STATUS[activeRequest!.status].guest} · ${activeRequest!.title}`;

  return (
    <Link
      href={href}
      data-testid={GUEST_TID.activeStrip}
      className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 focus-ring"
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
        <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-accent" />
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={2} />
    </Link>
  );
}
