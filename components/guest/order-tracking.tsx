'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { SkeletonCard, SkeletonRegion, SkeletonTimeline, Skeleton } from '@/components/ui/guest-kit/skeleton';
import { StatusTimeline } from '@/components/ui/guest-kit/status-timeline';
import { LiveIndicator } from './live-indicator';
import { DelayNotice } from './delay-notice';
import { EmptyHint } from './empty-hint';
import { useOrder } from '@/lib/guest/data/hooks';
import { useLiveState } from '@/lib/guest/data/live';
import { useNow } from '@/lib/guest/use-now';
import { buildOrderTimeline, orderStepIndex } from '@/lib/guest/status';
import { ORDER_STATUS } from '@/components/ui/tokens/status';
import { formatMoney, formatRelative } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, Order, OrderStatus, PublicHotel } from '@/lib/guest/types';

function PlacedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('placed') !== '1') return;
    // Reading the URL and clearing it can't happen until after hydration, and the "shown once"
    // banner is exactly the derived-from-history case set-state-in-effect can't express otherwise.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    params.delete('placed');
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div role="status" className="animate-rise flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
      <CheckCircle2 aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      {GUEST_COPY.tracking.placedBanner}
    </div>
  );
}

// Ignores a late, out-of-order poll response that would otherwise move the timeline backwards
// (docs/m2/04 §8b acceptance). Adopting newer values during render — rather than in an effect —
// is the documented "adjusting state when a value changes" pattern, so it never shows a stale
// frame first.
function useStableOrderStatus(order: Order): { status: OrderStatus; updatedAt: string } {
  const [stable, setStable] = useState({ status: order.status, updatedAt: order.updatedAt });
  const shouldAdopt = order.status === 'cancelled' || stable.status === 'cancelled' || orderStepIndex(order.status) >= orderStepIndex(stable.status);
  if (shouldAdopt && (order.status !== stable.status || order.updatedAt !== stable.updatedAt)) {
    setStable({ status: order.status, updatedAt: order.updatedAt });
    return { status: order.status, updatedAt: order.updatedAt };
  }
  return stable;
}

function OrderTrackingLoaded({ hotel, order }: { hotel: PublicHotel; order: Order }) {
  const now = useNow(30000);
  const live = useLiveState();
  const stable = useStableOrderStatus(order);
  const timeline = buildOrderTimeline({ status: stable.status, createdAt: order.createdAt, updatedAt: stable.updatedAt });
  const wording = ORDER_STATUS[stable.status];
  const isCancelled = stable.status === 'cancelled';
  const isDelivered = stable.status === 'delivered';

  const minutesInStatus = (now - new Date(stable.updatedAt).getTime()) / 60000;
  const delayKey =
    stable.status === 'pending' && minutesInStatus > 3 ? 'pending' : stable.status === 'preparing' && minutesInStatus > 25 ? 'preparing' : null;
  const [dismissedDelayKey, setDismissedDelayKey] = useState<string | null>(null);
  const showDelay = !!delayKey && delayKey !== dismissedDelayKey;

  const headline = isCancelled ? GUEST_COPY.tracking.orderCancelled : wording.guestHint;

  return (
    <div data-testid={GUEST_TID.orderTracking} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Button href={`/h/${hotel.slug}/activity`} variant="ghost" size="md">
          ‹ {GUEST_COPY.common.back}
        </Button>
        <span className="font-medium text-ink">{order.orderNumber}</span>
      </div>

      <PlacedBanner />

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{wording.guest}</p>
          {!isCancelled && !isDelivered && <LiveIndicator state={live} testId={GUEST_TID.orderLiveIndicator} />}
        </div>
        <h1 className="mt-1 font-display text-display-md text-ink">{headline}</h1>
        <p className="mt-1 text-sm text-ink-subtle">{GUEST_COPY.tracking.placedAgo(formatRelative(order.createdAt, now))}</p>
      </div>

      <StatusTimeline
        steps={timeline.steps}
        currentKey={timeline.currentKey}
        terminal={timeline.terminal}
        timeZone={hotel.timeZone}
        live={!isCancelled && !isDelivered}
        announce
        testId={GUEST_TID.orderTimeline}
        currentTestId={GUEST_TID.orderCurrent}
      />

      {showDelay && delayKey && (
        <DelayNotice message={GUEST_COPY.tracking.delay[delayKey]} onDismiss={() => setDismissedDelayKey(delayKey)} testId={GUEST_TID.orderDelayNotice} />
      )}

      <Card tone="default" className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{GUEST_COPY.tracking.items}</p>
        <ul className="flex flex-col gap-2">
          {order.lines.map((line) => (
            <li key={line.menuItemId} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">
                {line.quantity} × {line.name}
              </span>
              <span className="tabular text-ink">{formatMoney(line.totalPricePaise, hotel.currency)}</span>
            </li>
          ))}
        </ul>
        {order.specialInstructions && <p className="mt-3 text-sm italic text-ink-muted">&ldquo;{order.specialInstructions}&rdquo;</p>}
      </Card>

      <Card tone="raised" data-testid={GUEST_TID.orderTotals} className="flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.subtotal}</span>
          <span className="tabular text-sm text-ink">{formatMoney(order.subtotalPaise, hotel.currency)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.tax}</span>
          <span className="tabular text-sm text-ink">{formatMoney(order.taxPaise, hotel.currency)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.serviceCharge}</span>
          <span className="tabular text-sm text-ink">{formatMoney(order.serviceChargePaise, hotel.currency)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
          <span className="text-sm font-semibold text-ink">{GUEST_COPY.common.money.total}</span>
          <span className="tabular text-lg font-semibold text-ink">{formatMoney(order.totalPaise, hotel.currency)}</span>
        </div>
      </Card>

      {isDelivered ? (
        <Button href={`/h/${hotel.slug}/menu`} variant="primary" size="lg" fullWidth>
          {GUEST_COPY.tracking.orderAgain}
        </Button>
      ) : (
        <div className="flex gap-3">
          {hotel.contact.phone && (
            <Button href={`tel:${hotel.contact.phone}`} variant={isCancelled ? 'primary' : 'secondary'} size="lg" className="flex-1">
              {GUEST_COPY.common.callDesk}
            </Button>
          )}
          <Button href={`/h/${hotel.slug}/menu`} variant="secondary" size="lg" className="flex-1">
            {GUEST_COPY.tracking.orderElse}
          </Button>
        </div>
      )}
    </div>
  );
}

export function OrderTracking({ hotel, session, orderId }: { hotel: PublicHotel; session: GuestSession; orderId: string }) {
  const { data: order, isLoading, error } = useOrder(session, orderId);

  if (isLoading && !order) {
    return (
      <SkeletonRegion>
        <div className="flex flex-col gap-5" aria-hidden="true">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-56" />
          <SkeletonTimeline steps={5} />
          <SkeletonCard />
        </div>
      </SkeletonRegion>
    );
  }

  if (error || !order) {
    return <EmptyHint title={GUEST_COPY.tracking.notFound} action={{ label: GUEST_COPY.activity.title, href: `/h/${hotel.slug}/activity` }} />;
  }

  return <OrderTrackingLoaded hotel={hotel} order={order} />;
}
