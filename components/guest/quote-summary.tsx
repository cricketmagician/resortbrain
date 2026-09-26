import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { Currency, Quote } from '@/lib/guest/types';

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', emphasis && 'border-t border-line pt-2')}>
      <span className={cn('text-sm', emphasis ? 'font-semibold text-ink' : 'text-ink-muted')}>{label}</span>
      <span className={cn('tabular', emphasis ? 'text-lg font-semibold text-ink' : 'text-sm text-ink')}>{value}</span>
    </div>
  );
}

export interface QuoteSummaryProps {
  quote: Quote | null;
  loading: boolean;
  supportsQuote: boolean;
  hotelName: string;
  currency: Currency;
}

// The server-priced summary (docs/m2/04 §6): a live quote when the adapter supports one, dimmed
// while a debounced re-quote is in flight, or the honest no-quote fallback when it doesn't.
export function QuoteSummary({ quote, loading, supportsQuote, hotelName, currency }: QuoteSummaryProps) {
  if (!supportsQuote || !quote) {
    return (
      <Card tone="raised" data-testid={GUEST_TID.cartNoQuote} className="p-4">
        <p className="text-sm text-ink-muted">{GUEST_COPY.cart.summary.noQuote}</p>
      </Card>
    );
  }

  return (
    <Card
      tone="raised"
      data-testid={GUEST_TID.cartQuote}
      aria-live="polite"
      aria-busy={loading || undefined}
      className={cn('relative flex flex-col gap-2 p-4 transition-opacity duration-150', loading && 'opacity-60')}
    >
      {loading && (
        <Loader2 aria-hidden className="absolute right-4 top-4 size-4 animate-spin text-ink-subtle" strokeWidth={2} />
      )}
      <Row label={GUEST_COPY.common.money.subtotal} value={formatMoney(quote.subtotalPaise, currency)} />
      <Row label={GUEST_COPY.common.money.tax} value={formatMoney(quote.taxPaise, currency)} />
      <Row label={GUEST_COPY.common.money.serviceCharge} value={formatMoney(quote.serviceChargePaise, currency)} />
      <Row label={GUEST_COPY.cart.summary.total} value={formatMoney(quote.totalPaise, currency)} emphasis />
      <p className="pt-1 text-xs text-ink-subtle">{GUEST_COPY.cart.summary.calculated(hotelName)}</p>
    </Card>
  );
}
