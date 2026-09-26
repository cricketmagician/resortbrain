'use client';

import { useGuestSession } from '@/lib/guest/session';
import { displayFirstName } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { PublicHotel } from '@/lib/guest/types';

function greetingKind(timeZone: string): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(new Date()));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export function Greeting({ hotel }: { hotel: PublicHotel }) {
  const session = useGuestSession(hotel.id);

  // Reserves the same line height whether or not a session is present, so hydration never
  // shifts layout (docs/m2/04 §3 acceptance).
  if (!session) {
    return (
      <p data-testid={GUEST_TID.greeting} className="mt-2 min-h-6 text-base text-ink-muted">
        {GUEST_COPY.home.greeting.noSession(hotel.shortName)}
      </p>
    );
  }

  const kind = greetingKind(hotel.timeZone);
  const greeting = GUEST_COPY.home.greeting[kind](displayFirstName(session.guestName));

  return (
    <p data-testid={GUEST_TID.greeting} className="mt-2 min-h-6 text-base text-ink-muted">
      {greeting}
    </p>
  );
}
