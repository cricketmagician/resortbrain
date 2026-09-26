'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/guest-kit/toast';
import { LiveProvider } from '@/lib/guest/data/live';
import { useGuestSession } from '@/lib/guest/session';

// Session and cart are already global stores (lib/guest/session.ts, lib/guest/cart.ts) reachable
// from any component via their hooks, so they don't need their own Context providers here —
// LiveProvider is the one piece of guest state that genuinely needs to flow down as context.
export function GuestProviders({ hotelId, children }: { hotelId: string; children: ReactNode }) {
  const session = useGuestSession(hotelId);

  return (
    <ToastProvider>
      <LiveProvider session={session}>{children}</LiveProvider>
    </ToastProvider>
  );
}
