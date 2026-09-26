'use client';

// See cart-gate.tsx — a Server Component page can't pass the SessionGate render-prop function
// as a prop across the RSC boundary.
import { SessionGate } from './session-gate';
import { RequestTracking } from './request-tracking';
import type { PublicHotel } from '@/lib/guest/types';

export function RequestTrackingGate({ hotel, requestId }: { hotel: PublicHotel; requestId: string }) {
  return <SessionGate hotel={hotel}>{(session) => <RequestTracking hotel={hotel} session={session} requestId={requestId} />}</SessionGate>;
}
