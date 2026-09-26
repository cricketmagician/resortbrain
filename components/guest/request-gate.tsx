'use client';

// See cart-gate.tsx — a Server Component page can't pass the SessionGate render-prop function
// as a prop across the RSC boundary.
import { SessionGate } from './session-gate';
import { RequestForm } from './request-form';
import type { PublicHotel } from '@/lib/guest/types';

export function RequestGate({ hotel }: { hotel: PublicHotel }) {
  return <SessionGate hotel={hotel}>{(session) => <RequestForm hotel={hotel} session={session} />}</SessionGate>;
}
