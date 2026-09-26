'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from '@/components/guest/test-ids';
import { getLastHotelSlug } from '@/lib/guest/session';

export const dynamic = 'force-static';

// Precached by the service worker (docs/m2/04 §11) so it's what a guest sees when a navigation
// fails entirely offline and nothing cached matches.
export default function OfflinePage() {
  const [lastHotel, setLastHotel] = useState<string | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so this can't be a lazy useState initializer
    // without risking a hydration mismatch — read it here instead, same as the theme toggle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastHotel(getLastHotelSlug());
  }, []);

  return (
    <div data-testid={GUEST_TID.offline} className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-xl text-ink">{GUEST_COPY.offline.title}</h1>
      <p className="text-sm text-ink-muted">{GUEST_COPY.offline.body}</p>
      <div className="mt-2 flex flex-col items-center gap-3">
        {lastHotel && (
          <Button href={`/h/${lastHotel}/menu`} variant="primary" size="lg">
            {GUEST_COPY.menu.title}
          </Button>
        )}
        <Button variant="secondary" size="md" onClick={() => window.location.reload()}>
          {GUEST_COPY.common.retry}
        </Button>
      </div>
    </div>
  );
}
