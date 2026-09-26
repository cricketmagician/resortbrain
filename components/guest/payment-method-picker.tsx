'use client';

import { cn } from '@/lib/cn';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { PaymentMethod } from '@/lib/guest/types';

const METHODS: PaymentMethod[] = ['card_test', 'upi_test'];

export function PaymentMethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <div role="radiogroup" aria-label={GUEST_COPY.bill.payWith} className="flex flex-col gap-2">
      {METHODS.map((method) => {
        const selected = value === method;
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(method)}
            data-testid={GUEST_TID.billMethod(method)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-ring',
              selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong'
            )}
          >
            <span aria-hidden className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2', selected ? 'border-accent' : 'border-line-strong')}>
              {selected && <span className="size-2.5 rounded-full bg-accent" />}
            </span>
            <span className="text-sm text-ink">{GUEST_COPY.bill.method[method]}</span>
          </button>
        );
      })}
    </div>
  );
}
