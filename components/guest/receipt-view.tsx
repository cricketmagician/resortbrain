'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/guest-kit/button';
import { Card } from '@/components/ui/guest-kit/card';
import { Skeleton, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';
import { EmptyHint } from './empty-hint';
import { AnimatedCheck } from './animated-check';
import { ResilientImage } from './resilient-image';
import { FeedbackForm } from './feedback-form';
import { PrintableInvoice } from './printable-invoice';
import { PrintableReceipt } from './printable-receipt';
import { useInvoice, useOrders } from '@/lib/guest/data/hooks';
import { getGuestApi } from '@/lib/guest/data';
import { formatDateTime, formatMoney } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel } from '@/lib/guest/types';

type PrintFormat = 'a4' | 'thermal' | null;

function ReceiptSkeleton() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col items-center gap-4" aria-hidden="true">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}

export function ReceiptView({ hotel, session, invoiceId }: { hotel: PublicHotel; session: GuestSession; invoiceId: string }) {
  const router = useRouter();
  const { data: invoice, isLoading: invoiceLoading, error: invoiceError } = useInvoice(session);
  const { data: orders, isLoading: ordersLoading } = useOrders(session);
  const [printFormat, setPrintFormat] = useState<PrintFormat>(null);
  const [canShare, setCanShare] = useState(false);
  const [supportsFeedback, setSupportsFeedback] = useState(true);

  useEffect(() => {
    // navigator.share only exists in the browser, so this can't be known until after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    let active = true;
    getGuestApi().then((api) => {
      if (active) setSupportsFeedback(api.capabilities.feedback);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!printFormat) return;
    // A microtask delay lets the just-rendered @page rule and print-only content paint before
    // the print dialog freezes the page.
    const raf = requestAnimationFrame(() => window.print());
    function handleAfterPrint() {
      setPrintFormat(null);
    }
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printFormat]);

  // The mock (and today's M1 shape) has one current invoice per stay, so a stale or mistyped
  // invoiceId in the URL just means "not the guest's current invoice" — bounce to the bill, same
  // as "not paid (redirect)" (docs/m2/04 §10).
  const shouldRedirectToBill = !invoiceLoading && !invoiceError && !!invoice && (invoice.status !== 'paid' || invoice.id !== invoiceId);
  useEffect(() => {
    if (shouldRedirectToBill) router.replace(`/h/${hotel.slug}/bill`);
  }, [shouldRedirectToBill, router, hotel.slug]);

  if ((invoiceLoading && !invoice) || (ordersLoading && orders === undefined) || shouldRedirectToBill) {
    return <ReceiptSkeleton />;
  }

  if (invoiceError || !invoice) {
    return <EmptyHint title={GUEST_COPY.qr.error.title} action={{ label: GUEST_COPY.bill.title, href: `/h/${hotel.slug}/bill` }} />;
  }

  const relevantOrders = (orders ?? []).filter((o) => o.status !== 'cancelled');
  const methodShort = invoice.paymentMethod ? GUEST_COPY.receipt.methodShort[invoice.paymentMethod] : '';
  const methodLong = invoice.paymentMethod ? GUEST_COPY.receipt.methodLong[invoice.paymentMethod] : '';

  function share() {
    if (!invoice) return;
    navigator.share({ title: GUEST_COPY.receipt.success, text: GUEST_COPY.receipt.shareText(invoice.invoiceNumber, hotel.shortName) }).catch(() => {});
  }

  return (
    <div data-testid={GUEST_TID.receipt} className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <AnimatedCheck className="size-16" />
        <h1 className="font-display text-xl text-ink">{GUEST_COPY.receipt.success}</h1>
        {invoice.paidAt && (
          <p className="tabular text-sm text-ink-muted">
            {formatMoney(invoice.totalPaise, session.currency)} · {methodShort} · {formatDateTime(invoice.paidAt, hotel.timeZone)}
          </p>
        )}
      </div>

      <Card tone="default" className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-hotel">
            {hotel.logoUrl ? (
              <ResilientImage
                src={hotel.logoUrl}
                alt=""
                width={32}
                height={32}
                className="size-full object-cover"
                fallbackClassName="grid size-full place-items-center"
                fallback={<span className="font-display text-xs text-hotel">{hotel.shortName.charAt(0)}</span>}
              />
            ) : (
              <span className="font-display text-xs text-hotel">{hotel.shortName.charAt(0)}</span>
            )}
          </span>
          <span className="font-display text-base text-ink">{hotel.name}</span>
        </div>
        <p className="text-sm text-ink-muted">{GUEST_COPY.receipt.invoiceRoom(invoice.invoiceNumber, session.roomNumber)}</p>
        <p className="text-sm text-ink-muted">{GUEST_COPY.receipt.guest(session.guestName)}</p>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {relevantOrders.map((order) => (
            <div key={order.id}>
              <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
              {order.lines.map((line) => (
                <div key={line.menuItemId} className="flex justify-between gap-2 text-sm text-ink-muted">
                  <span>
                    {line.quantity} × {line.name}
                  </span>
                  <span className="shrink-0 tabular">{formatMoney(line.totalPricePaise, session.currency)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">{GUEST_COPY.common.money.subtotal}</span>
            <span className="tabular text-ink">{formatMoney(invoice.subtotalPaise, session.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">{GUEST_COPY.common.money.tax}</span>
            <span className="tabular text-ink">{formatMoney(invoice.taxPaise, session.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">{GUEST_COPY.common.money.serviceCharge}</span>
            <span className="tabular text-ink">{formatMoney(invoice.serviceChargePaise, session.currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-ink">{GUEST_COPY.bill.totalDue}</span>
            <span className="tabular text-ink">{formatMoney(invoice.totalPaise, session.currency)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-muted">
            <span>{GUEST_COPY.receipt.paidWith(methodLong)}</span>
          </div>
        </div>
      </Card>

      <div className="no-print flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={() => setPrintFormat('thermal')} data-testid={GUEST_TID.receiptPrint}>
          {GUEST_COPY.receipt.print}
        </Button>
        <Button variant="secondary" size="md" onClick={() => setPrintFormat('a4')} data-testid={GUEST_TID.receiptInvoicePdf}>
          {GUEST_COPY.receipt.pdf}
        </Button>
        {canShare && (
          <Button variant="secondary" size="md" onClick={share} data-testid={GUEST_TID.receiptShare}>
            {GUEST_COPY.receipt.share}
          </Button>
        )}
      </div>

      <Button href={`/h/${hotel.slug}`} variant="ghost" size="md" className="no-print self-start">
        {GUEST_COPY.receipt.home}
      </Button>

      {supportsFeedback && <FeedbackForm hotel={hotel} session={session} invoiceId={invoice.id} />}

      <div style={{ display: printFormat === 'a4' ? undefined : 'none' }}>
        <PrintableInvoice hotel={hotel} session={session} invoice={invoice} orders={relevantOrders} />
      </div>
      <div style={{ display: printFormat === 'thermal' ? undefined : 'none' }}>
        <PrintableReceipt hotel={hotel} session={session} invoice={invoice} orders={relevantOrders} />
      </div>
      {printFormat === 'a4' && <style>{'@page { size: A4; margin: 16mm; }'}</style>}
      {printFormat === 'thermal' && <style>{'@page { size: 80mm auto; margin: 4mm; }'}</style>}
    </div>
  );
}
