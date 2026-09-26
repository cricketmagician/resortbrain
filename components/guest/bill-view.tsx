'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { StatusPill } from '@/components/ui/guest-kit/status-timeline';
import { Skeleton, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';
import { EmptyHint } from './empty-hint';
import { PaymentMethodPicker } from './payment-method-picker';
import { PaymentSheet } from './payment-sheet';
import { useInvoice, useOrders } from '@/lib/guest/data/hooks';
import { useNow } from '@/lib/guest/use-now';
import { formatMoney, formatRelative } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PaymentMethod, PublicHotel } from '@/lib/guest/types';

function BillSkeleton() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}

export function BillView({ hotel, session }: { hotel: PublicHotel; session: GuestSession }) {
  const now = useNow(30000);
  const { data: invoice, error: invoiceError, isLoading: invoiceLoading, mutate: refetchInvoice } = useInvoice(session);
  const { data: orders, isLoading: ordersLoading } = useOrders(session);
  const [method, setMethod] = useState<PaymentMethod>('card_test');
  const [sheetOpen, setSheetOpen] = useState(false);

  if ((invoiceLoading && !invoice) || (ordersLoading && orders === undefined)) {
    return <BillSkeleton />;
  }

  if (invoiceError || !invoice) {
    return <EmptyHint title={GUEST_COPY.qr.error.title} action={{ label: GUEST_COPY.common.retry, onClick: () => refetchInvoice() }} />;
  }

  const relevantOrders = (orders ?? []).filter((o) => o.status !== 'cancelled');
  const isPaid = invoice.status === 'paid';
  const hasNothing = invoice.totalPaise === 0 || relevantOrders.length === 0;

  return (
    <div data-testid={GUEST_TID.bill} className="flex flex-col gap-5 pb-4">
      <h1 className="font-display text-display-md text-ink">{GUEST_COPY.bill.title}</h1>

      <Card tone="default" className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span data-testid={GUEST_TID.billInvoiceNumber} className="font-medium text-ink">
            {invoice.invoiceNumber}
          </span>
          <span data-testid={GUEST_TID.billStatus}>
            <StatusPill tone={isPaid ? 'success' : 'warning'}>{isPaid ? GUEST_COPY.bill.paid : GUEST_COPY.bill.unpaid}</StatusPill>
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{GUEST_COPY.bill.roomAndGuest(session.roomNumber, session.guestName)}</p>

        {hasNothing ? (
          <EmptyHint title={GUEST_COPY.bill.nothing.title} body={GUEST_COPY.bill.nothing.body} action={{ label: GUEST_COPY.menu.title, href: `/h/${hotel.slug}/menu` }} />
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line border-t border-line">
            {relevantOrders.map((order) => (
              <li key={order.id} data-testid={GUEST_TID.billOrder(order.id)} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-ink">
                    {order.orderNumber} · {formatRelative(order.createdAt, now)}
                  </span>
                  <span className="tabular text-sm font-medium text-ink">{formatMoney(order.totalPaise, session.currency)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-subtle">{order.lines.map((l) => `${l.name} ×${l.quantity}`).join(' · ')}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!hasNothing && (
        <>
          <Card tone="raised" className="flex flex-col gap-2 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.subtotal}</span>
              <span className="tabular text-sm text-ink">{formatMoney(invoice.subtotalPaise, session.currency)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.tax}</span>
              <span className="tabular text-sm text-ink">{formatMoney(invoice.taxPaise, session.currency)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-muted">{GUEST_COPY.common.money.serviceCharge}</span>
              <span className="tabular text-sm text-ink">{formatMoney(invoice.serviceChargePaise, session.currency)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
              <span className="text-sm font-semibold text-ink">{GUEST_COPY.bill.totalDue}</span>
              <span data-testid={GUEST_TID.billTotal} className="tabular text-lg font-semibold text-ink">
                {formatMoney(invoice.totalPaise, session.currency)}
              </span>
            </div>
          </Card>

          {isPaid ? (
            <Button href={`/h/${hotel.slug}/receipt/${invoice.id}`} variant="primary" size="lg" fullWidth>
              {GUEST_COPY.bill.viewReceipt}
            </Button>
          ) : (
            <>
              <p className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">{GUEST_COPY.bill.testMode}</p>
              <div>
                <p className="mb-2 text-sm font-medium text-ink">{GUEST_COPY.bill.payWith}</p>
                <PaymentMethodPicker value={method} onChange={setMethod} />
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={() => setSheetOpen(true)} data-testid={GUEST_TID.billPay}>
                {GUEST_COPY.bill.pay(formatMoney(invoice.totalPaise, session.currency))}
              </Button>
              <PaymentSheet open={sheetOpen} onOpenChange={setSheetOpen} hotel={hotel} session={session} invoice={invoice} method={method} />
            </>
          )}
        </>
      )}
    </div>
  );
}
