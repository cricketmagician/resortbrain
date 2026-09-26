import Link from 'next/link';
import { Card } from '@/components/ui/guest-kit/card';
import { StatusPill } from '@/components/ui/guest-kit/status-timeline';
import { ORDER_STATUS } from '@/components/ui/tokens/status';
import { formatMoney, formatRelative } from '@/lib/guest/format';
import { GUEST_TID } from './test-ids';
import type { Currency, Order } from '@/lib/guest/types';

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'preparing', 'ready']);

export function OrderCard({ order, hotelSlug, currency, live, now }: { order: Order; hotelSlug: string; currency: Currency; live: boolean; now: number }) {
  const names = order.lines
    .slice(0, 2)
    .map((l) => l.name)
    .join(', ');
  const extra = order.lines.length - 2;
  const wording = ORDER_STATUS[order.status];
  const isActive = ACTIVE_STATUSES.has(order.status);

  return (
    <Link href={`/h/${hotelSlug}/orders/${order.id}`} data-testid={GUEST_TID.activityOrder(order.id)} className="block rounded-lg focus-ring">
      <Card tone="default" interactive className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-ink">{order.orderNumber}</span>
          <StatusPill tone={wording.tone} live={live && isActive}>
            {wording.guest}
          </StatusPill>
        </div>
        <p className="line-clamp-1 text-sm text-ink-muted">
          {names}
          {extra > 0 ? ` +${extra} more` : ''}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-subtle">{formatRelative(order.createdAt, now)}</span>
          <span className="tabular font-semibold text-ink">{formatMoney(order.totalPaise, currency)}</span>
        </div>
      </Card>
    </Link>
  );
}
