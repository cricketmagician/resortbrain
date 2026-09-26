'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { SkeletonCard } from '@/components/ui/guest-kit/skeleton';
import { OrderCard } from './order-card';
import { RequestCard } from './request-card';
import { EmptyHint } from './empty-hint';
import { useOrders, useRequests } from '@/lib/guest/data/hooks';
import { useLiveState } from '@/lib/guest/data/live';
import { useNow } from '@/lib/guest/use-now';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel } from '@/lib/guest/types';

type Filter = 'all' | 'orders' | 'requests';

const FILTERS: Filter[] = ['all', 'orders', 'requests'];

export function ActivityFeed({ hotel, session }: { hotel: PublicHotel; session: GuestSession }) {
  const [filter, setFilter] = useState<Filter>('all');
  const live = useLiveState();
  const now = useNow(30000);

  const { data: orders, error: ordersError, isLoading: ordersLoading, mutate: refetchOrders } = useOrders(session);
  const { data: requests, error: requestsError, isLoading: requestsLoading, mutate: refetchRequests } = useRequests(session);

  const loading = (ordersLoading && orders === undefined) || (requestsLoading && requests === undefined);
  const hasError = !!ordersError || !!requestsError;
  const isLive = live === 'live' || live === 'polling';

  const items = useMemo(() => {
    const merged: Array<{ key: string; at: string; kind: 'order' | 'request' }> = [];
    if (filter !== 'requests') for (const o of orders ?? []) merged.push({ key: o.id, at: o.createdAt, kind: 'order' });
    if (filter !== 'orders') for (const r of requests ?? []) merged.push({ key: r.id, at: r.createdAt, kind: 'request' });
    return merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [orders, requests, filter]);

  return (
    <div data-testid={GUEST_TID.activity} className="flex flex-col gap-4">
      <h1 className="font-display text-display-md text-ink">{GUEST_COPY.activity.title}</h1>

      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant="chip"
            pressed={filter === f}
            onClick={() => setFilter(f)}
            data-testid={GUEST_TID.activityFilter(f)}
          >
            {GUEST_COPY.activity.filters[f]}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && hasError && (
        <EmptyHint
          title={GUEST_COPY.activity.error}
          action={{
            label: GUEST_COPY.common.retry,
            onClick: () => {
              refetchOrders();
              refetchRequests();
            },
          }}
        />
      )}

      {!loading && !hasError && items.length === 0 && orders !== undefined && requests !== undefined && (
        <EmptyHint
          title={filter === 'all' ? GUEST_COPY.activity.empty.title : GUEST_COPY.activity.emptyFiltered(GUEST_COPY.activity.filters[filter])}
          body={filter === 'all' ? GUEST_COPY.activity.empty.body : undefined}
          action={
            filter === 'all'
              ? [
                  { label: GUEST_COPY.activity.empty.orderFood, href: `/h/${hotel.slug}/menu` },
                  { label: GUEST_COPY.activity.empty.makeRequest, href: `/h/${hotel.slug}/request` },
                ]
              : undefined
          }
        />
      )}

      {!loading && !hasError && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((item) =>
            item.kind === 'order' ? (
              <OrderCard
                key={`order-${item.key}`}
                order={orders!.find((o) => o.id === item.key)!}
                hotelSlug={hotel.slug}
                currency={session.currency}
                live={isLive}
                now={now}
              />
            ) : (
              <RequestCard key={`request-${item.key}`} request={requests!.find((r) => r.id === item.key)!} hotelSlug={hotel.slug} live={isLive} now={now} />
            )
          )}
        </div>
      )}
    </div>
  );
}
