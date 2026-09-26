'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { PublicHotel } from '@/lib/guest/types';

export type RejoinReason = 'expired' | 'revoked' | 'checked_out' | 'invalid' | 'default';

export function RejoinScreen({ reason = 'default', hotel }: { reason?: RejoinReason; hotel?: PublicHotel | null }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const copy = GUEST_COPY.rejoin[reason];
  const phone = hotel?.contact.phone;

  return (
    <div data-testid={GUEST_TID.rejoin} className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-6 grid size-20 place-items-center rounded-full border-2 border-line-strong">
        <span className="font-display text-2xl text-ink-muted">RB</span>
      </span>
      <h1 className="font-display text-display-md text-ink">{copy.headline}</h1>
      <p className="mt-3 max-w-xs text-sm text-ink-muted">{copy.body}</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth onClick={() => setTipsOpen(true)}>
          {GUEST_COPY.rejoin.howToScan}
        </Button>
        {phone && (
          <Button href={`tel:${phone}`} variant="secondary" size="lg" fullWidth>
            {GUEST_COPY.common.callDesk}
          </Button>
        )}
      </div>

      <Sheet open={tipsOpen} onOpenChange={setTipsOpen} title={GUEST_COPY.rejoin.howToScan}>
        <ol className="flex flex-col gap-3">
          {GUEST_COPY.rejoin.scanTips.map((tip, i) => (
            <li key={tip} className="flex items-start gap-3 text-sm text-ink-muted">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
              {tip}
            </li>
          ))}
        </ol>
      </Sheet>
    </div>
  );
}
