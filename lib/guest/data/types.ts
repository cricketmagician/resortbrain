// lib/guest/data/types.ts
// The one interface every guest screen talks to. `lib/guest/data/index.ts` picks the live (http)
// or mock implementation; UI code never knows which one it got.

import type {
  CartLine,
  GuestSession,
  Invoice,
  Order,
  PaymentMethod,
  Quote,
  RequestCategory,
  RequestPriority,
  ServiceRequest,
  StayEvent,
} from '../types';

export interface GuestApi {
  readonly source: 'api' | 'mock';
  readonly capabilities: { quote: boolean; feedback: boolean };

  resolveQr(qrToken: string): Promise<GuestSession>;
  resumeSession(session: GuestSession): Promise<GuestSession>;

  /** Returns null when the adapter doesn't support pre-order quotes (capabilities.quote === false). */
  quoteOrder(session: GuestSession, lines: CartLine[]): Promise<Quote | null>;
  placeOrder(
    session: GuestSession,
    input: { lines: CartLine[]; specialInstructions?: string; idempotencyKey: string }
  ): Promise<Order>;
  listOrders(session: GuestSession): Promise<Order[]>;

  createRequest(
    session: GuestSession,
    input: { category: RequestCategory; title: string; details?: string; priority: RequestPriority }
  ): Promise<ServiceRequest>;
  listRequests(session: GuestSession): Promise<ServiceRequest[]>;

  getInvoice(session: GuestSession): Promise<Invoice>;
  pay(
    session: GuestSession,
    input: { invoiceId: string; amountPaise: number; method: PaymentMethod; idempotencyKey: string }
  ): Promise<Invoice>;

  submitFeedback(
    session: GuestSession,
    input: { invoiceId?: string; orderId?: string; rating: 1 | 2 | 3 | 4 | 5; tags: string[]; comment?: string }
  ): Promise<void>;

  /** Push-style updates where the adapter has them (the mock simulator's timers). Returns an
   *  unsubscribe function. The http adapter's api-mode liveness comes from SWR polling
   *  (data/hooks.ts) and, optionally, Supabase Realtime (data/live.ts) instead of this method. */
  subscribe(session: GuestSession, onEvent: (event: StayEvent) => void): () => void;
}

export type GuestApiErrorKind =
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'expired'
  | 'invalid'
  | 'not_found'
  | 'validation'
  | 'unsupported'
  | 'server';

export class GuestApiError extends Error {
  constructor(
    public kind: GuestApiErrorKind,
    message: string,
    public retryAfterSec?: number
  ) {
    super(message);
    this.name = 'GuestApiError';
  }
}
