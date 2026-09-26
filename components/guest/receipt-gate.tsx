'use client';

// See cart-gate.tsx — a Server Component page can't pass the SessionGate render-prop function
// as a prop across the RSC boundary.
import { SessionGate } from './session-gate';
import { ReceiptView } from './receipt-view';
import type { PublicHotel } from '@/lib/guest/types';

export function ReceiptGate({ hotel, invoiceId }: { hotel: PublicHotel; invoiceId: string }) {
  return <SessionGate hotel={hotel}>{(session) => <ReceiptView hotel={hotel} session={session} invoiceId={invoiceId} />}</SessionGate>;
}
