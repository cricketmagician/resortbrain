'use client';

// See cart-gate.tsx — a Server Component page can't pass the SessionGate render-prop function
// as a prop across the RSC boundary.
import { SessionGate } from './session-gate';
import { OrderTracking } from './order-tracking';
import type { PublicHotel } from '@/lib/guest/types';

export function OrderTrackingGate({ hotel, orderId }: { hotel: PublicHotel; orderId: string }) {
  return <SessionGate hotel={hotel}>{(session) => <OrderTracking hotel={hotel} session={session} orderId={orderId} />}</SessionGate>;
}
