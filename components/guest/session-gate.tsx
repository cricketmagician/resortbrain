'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { useGuestSession } from '@/lib/guest/session';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { GuestSession, PublicHotel } from '@/lib/guest/types';

// Wraps stay-scoped pages (cart, request, activity, bill, receipt). Renders its children with a
// real session, or a calm browse-only prompt when there isn't one for this hotel.
export function SessionGate({ hotel, children }: { hotel: PublicHotel; children: (session: GuestSession) => ReactNode }) {
  const session = useGuestSession(hotel.id);

  if (!session) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center py-10">
        <Card tone="outline" className="max-w-sm p-6 text-center">
          <p className="font-display text-lg text-ink">{GUEST_COPY.menu.scanToOrder}</p>
          <p className="mt-2 text-sm text-ink-muted">{GUEST_COPY.home.noSession.body}</p>
          {hotel.contact.phone && (
            <Button href={`tel:${hotel.contact.phone}`} variant="secondary" size="md" className="mt-5">
              {GUEST_COPY.common.callDesk}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return <>{children(session)}</>;
}
