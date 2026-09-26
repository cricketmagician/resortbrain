'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { Lock } from 'lucide-react';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { Button } from '@/components/ui/guest-kit/button';
import { getGuestApi, GuestApiError } from '@/lib/guest/data';
import { invoiceKey } from '@/lib/guest/data/hooks';
import * as idempotency from '@/lib/guest/idempotency';
import { clearSession } from '@/lib/guest/session';
import { formatMoney } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, Invoice, PaymentMethod, PublicHotel } from '@/lib/guest/types';

export interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: PublicHotel;
  session: GuestSession;
  invoice: Invoice;
  method: PaymentMethod;
}

// The pay flow (docs/m2/04 §9): confirm, then a real (server) payment call, kept on screen for at
// least 1.2s so "Processing securely…" never flickers on a fast mock response.
export function PaymentSheet({ open, onOpenChange, hotel, session, invoice, method }: PaymentSheetProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus('processing');
    setErrorMessage(null);

    const key = idempotency.forPayment(invoice.id);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const api = await getGuestApi();
      const [paidInvoice] = await Promise.all([
        api.pay(session, { invoiceId: invoice.id, amountPaise: invoice.totalPaise, method, idempotencyKey: key }),
        minDelay,
      ]);
      idempotency.settle('payment', invoice.id);
      await mutate(invoiceKey(session.stayId), paidInvoice, { revalidate: false });
      router.replace(`/h/${hotel.slug}/receipt/${paidInvoice.id}`);
    } catch (err) {
      await minDelay;
      if (err instanceof GuestApiError && err.kind === 'expired') {
        clearSession();
        router.push(`/h/${hotel.slug}/rejoin?reason=expired`);
        return;
      }
      setStatus('error');
      setErrorMessage(GUEST_COPY.bill.error);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      dismissible={status !== 'processing'}
      title={GUEST_COPY.bill.confirmPayment}
      description={GUEST_COPY.bill.method[method]}
    >
      <div data-testid={GUEST_TID.paymentSheet} className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between rounded-lg bg-surface-2 px-4 py-3">
          <span className="text-sm text-ink-muted">{GUEST_COPY.bill.totalDue}</span>
          <span className="tabular text-2xl font-semibold text-ink">{formatMoney(invoice.totalPaise, session.currency)}</span>
        </div>

        {status === 'processing' && (
          <p
            data-testid={GUEST_TID.paymentProcessing}
            role="status"
            className="flex items-center justify-center gap-2 rounded-lg bg-surface-2 py-4 text-sm text-ink-muted"
          >
            <Lock aria-hidden className="size-4" strokeWidth={1.75} />
            {GUEST_COPY.bill.processing}
          </p>
        )}

        {status === 'error' && errorMessage && (
          <p data-testid={GUEST_TID.paymentError} role="alert" className="text-sm text-danger">
            {errorMessage}
          </p>
        )}

        <Button variant="primary" size="lg" fullWidth loading={status === 'processing'} onClick={handleConfirm} data-testid={GUEST_TID.paymentConfirm}>
          {status === 'error' ? GUEST_COPY.common.retry : GUEST_COPY.bill.confirmPayment}
        </Button>
      </div>
    </Sheet>
  );
}
