// lib/guest/data/http.ts
// The live adapter to M1's guest API (docs/m2/05 §1, §4). Validates every response with Zod
// before mapping snake_case wire shapes onto the guest view models — bad data never reaches the
// UI as NaN or "undefined".

import { z } from 'zod';
import { hotelIdToSlug } from '../hotel-directory';
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
} from '../types';
import { GuestApiError, type GuestApi, type GuestApiErrorKind } from './types';

const TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [400, 1200];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableKind(kind: GuestApiErrorKind): boolean {
  return kind === 'network' || kind === 'timeout' || kind === 'server';
}

async function handleResponse<T>(res: Response, context: string): Promise<T> {
  if (res.ok) return (await res.json()) as T;

  let message = res.statusText || 'Something went wrong.';
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string') message = body.error;
  } catch {
    // body wasn't JSON — keep the status text
  }

  if (context === 'stays/verify' && res.status === 404) throw new GuestApiError('invalid', message);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After')) || 10;
    throw new GuestApiError('rate_limited', message, retryAfter);
  }
  if (res.status === 401 || res.status === 403) throw new GuestApiError('expired', message);
  if (res.status === 400) {
    if (/unauthori[sz]ed|expired|invalid .*token/i.test(message)) throw new GuestApiError('expired', message);
    throw new GuestApiError('validation', message);
  }
  if (res.status === 404) throw new GuestApiError('not_found', message);
  throw new GuestApiError('server', message);
}

async function fetchJson<T>(path: string, init: RequestInit, context: string): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new GuestApiError('network', 'You appear to be offline.');
  }
  let res: Response;
  try {
    res = await fetch(path, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new GuestApiError('timeout', 'The request timed out.');
    }
    throw new GuestApiError('network', 'Could not reach the server.');
  }
  return handleResponse<T>(res, context);
}

/** Idempotent GETs retry twice on network/timeout/5xx (docs/m2/05 §4). POSTs never auto-retry —
 *  the UI's own Retry button reuses the same idempotency key instead. */
async function getJson<T>(path: string, context: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    try {
      return await fetchJson<T>(path, { method: 'GET', cache: 'no-store' }, context);
    } catch (err) {
      lastError = err;
      if (!(err instanceof GuestApiError) || !isRetryableKind(err.kind)) throw err;
    }
  }
  throw lastError;
}

function postJson<T>(path: string, body: unknown, context: string): Promise<T> {
  return fetchJson<T>(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    context
  );
}

/** Where the stay token travels. M1 currently reads it from the JSON body (POST) or the query
 *  string (GET); contract request C4 asks for `Authorization: Bearer` instead. Keeping this in
 *  one place makes that a one-line change later. */
function withStayQuery(session: GuestSession, extra: Record<string, string> = {}): string {
  return `?${new URLSearchParams({ stayToken: session.stayToken, ...extra }).toString()}`;
}

function withStayBody<T extends object>(session: GuestSession, body: T): T & { stayToken: string } {
  return { ...body, stayToken: session.stayToken };
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[guest/http] ${context} response failed validation`, result.error.flatten());
    }
    throw new GuestApiError('server', "We couldn't read the server's response. Please try again.");
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Wire schemas — mirrors M1's shapes exactly (docs/m2/05 §1)
// ---------------------------------------------------------------------------

const StayTokenSessionSchema = z.object({
  stayId: z.string(),
  hotelId: z.string(),
  hotelName: z.string(),
  roomId: z.string(),
  roomNumber: z.string(),
  guestName: z.string(),
  stayToken: z.string(),
  currency: z.string(),
  taxRate: z.number(),
  serviceCharge: z.number(),
});

const OrderItemSchema = z.object({
  menuItemId: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  unitPricePaise: z.number(),
  totalPricePaise: z.number(),
});

const OrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']),
  room_number: z.string(),
  items: z.array(OrderItemSchema),
  subtotal_paise: z.number(),
  tax_paise: z.number(),
  service_charge_paise: z.number(),
  total_paise: z.number(),
  special_instructions: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

const ServiceRequestSchema = z.object({
  id: z.string(),
  room_number: z.string(),
  category: z.enum(['housekeeping', 'amenities', 'front_desk', 'maintenance']),
  title: z.string(),
  details: z.string().optional(),
  status: z.enum(['created', 'acknowledged', 'in_progress', 'completed', 'cancelled', 'rejected']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  assigned_name: z.string().optional(),
  sla_minutes: z.number().optional(),
  created_at: z.string(),
  acknowledged_at: z.string().optional(),
  completed_at: z.string().optional(),
});

const InvoiceSchema = z.object({
  id: z.string(),
  invoice_number: z.string(),
  status: z.enum(['draft', 'issued', 'paid']),
  subtotal_paise: z.number(),
  tax_paise: z.number(),
  service_charge_paise: z.number(),
  discount_paise: z.number().optional(),
  total_paise: z.number(),
  created_at: z.string(),
  paid_at: z.string().optional(),
  payment_method: z.enum(['card_test', 'upi_test']).optional(),
});

// ---------------------------------------------------------------------------
// Mapping — snake_case wire shapes onto the guest view models
// ---------------------------------------------------------------------------

function mapSession(raw: z.infer<typeof StayTokenSessionSchema>): GuestSession {
  return {
    stayToken: raw.stayToken,
    stayId: raw.stayId,
    hotelId: raw.hotelId,
    hotelSlug: hotelIdToSlug(raw.hotelId) ?? raw.hotelId,
    hotelName: raw.hotelName,
    roomId: raw.roomId,
    roomNumber: raw.roomNumber,
    guestName: raw.guestName,
    currency: raw.currency,
    validatedAt: new Date().toISOString(),
  };
}

function mapOrder(raw: z.infer<typeof OrderSchema>): Order {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    status: raw.status,
    roomNumber: raw.room_number,
    lines: raw.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.itemName,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      totalPricePaise: item.totalPricePaise,
    })),
    subtotalPaise: raw.subtotal_paise,
    taxPaise: raw.tax_paise,
    serviceChargePaise: raw.service_charge_paise,
    totalPaise: raw.total_paise,
    specialInstructions: raw.special_instructions,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapRequest(raw: z.infer<typeof ServiceRequestSchema>): ServiceRequest {
  return {
    id: raw.id,
    category: raw.category,
    title: raw.title,
    details: raw.details,
    status: raw.status,
    priority: raw.priority,
    roomNumber: raw.room_number,
    assigneeFirstName: raw.assigned_name?.split(' ')[0],
    slaMinutes: raw.sla_minutes,
    createdAt: raw.created_at,
    acknowledgedAt: raw.acknowledged_at,
    completedAt: raw.completed_at,
  };
}

function mapInvoice(raw: z.infer<typeof InvoiceSchema>): Invoice {
  return {
    id: raw.id,
    invoiceNumber: raw.invoice_number,
    status: raw.status,
    subtotalPaise: raw.subtotal_paise,
    taxPaise: raw.tax_paise,
    serviceChargePaise: raw.service_charge_paise,
    discountPaise: raw.discount_paise ?? 0,
    totalPaise: raw.total_paise,
    createdAt: raw.created_at,
    paidAt: raw.paid_at,
    paymentMethod: raw.payment_method,
  };
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

export const httpApi: GuestApi = {
  source: 'api',
  // C3 (order quotes) and C5 (feedback) aren't shipped yet (docs/m2/10 §2) — flip these once they are.
  capabilities: { quote: false, feedback: false },

  async resolveQr(qrToken: string): Promise<GuestSession> {
    const data = await postJson<{ success: boolean; session: unknown }>('/api/stays/verify', { qrToken }, 'stays/verify');
    return mapSession(parseOrThrow(StayTokenSessionSchema, data.session, 'stays/verify'));
  },

  async resumeSession(session: GuestSession): Promise<GuestSession> {
    const data = await postJson<{ success: boolean; session: unknown }>(
      '/api/stays/verify',
      { stayToken: session.stayToken },
      'stays/verify'
    );
    return mapSession(parseOrThrow(StayTokenSessionSchema, data.session, 'stays/verify'));
  },

  async quoteOrder(): Promise<Quote | null> {
    return null;
  },

  async placeOrder(
    session: GuestSession,
    input: { lines: CartLine[]; specialInstructions?: string; idempotencyKey: string }
  ): Promise<Order> {
    const body = withStayBody(session, {
      items: input.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      specialInstructions: input.specialInstructions,
      idempotencyKey: input.idempotencyKey,
    });
    const data = await postJson<{ success: boolean; order: unknown }>('/api/orders', body, 'orders');
    return mapOrder(parseOrThrow(OrderSchema, data.order, 'orders'));
  },

  async listOrders(session: GuestSession): Promise<Order[]> {
    const data = await getJson<{ orders: unknown[] }>(`/api/orders${withStayQuery(session)}`, 'orders');
    return data.orders.map((o) => mapOrder(parseOrThrow(OrderSchema, o, 'orders')));
  },

  async createRequest(
    session: GuestSession,
    input: { category: RequestCategory; title: string; details?: string; priority: RequestPriority }
  ): Promise<ServiceRequest> {
    const body = withStayBody(session, input);
    const data = await postJson<{ success: boolean; request: unknown }>('/api/requests', body, 'requests');
    return mapRequest(parseOrThrow(ServiceRequestSchema, data.request, 'requests'));
  },

  async listRequests(session: GuestSession): Promise<ServiceRequest[]> {
    const data = await getJson<{ requests: unknown[] }>(`/api/requests${withStayQuery(session)}`, 'requests');
    return data.requests.map((r) => mapRequest(parseOrThrow(ServiceRequestSchema, r, 'requests')));
  },

  async getInvoice(session: GuestSession): Promise<Invoice> {
    const data = await getJson<{ invoice: unknown }>(`/api/billing${withStayQuery(session)}`, 'billing');
    return mapInvoice(parseOrThrow(InvoiceSchema, data.invoice, 'billing'));
  },

  async pay(
    session: GuestSession,
    input: { invoiceId: string; amountPaise: number; method: PaymentMethod; idempotencyKey: string }
  ): Promise<Invoice> {
    const body = withStayBody(session, {
      invoiceId: input.invoiceId,
      amountPaise: input.amountPaise,
      paymentMethod: input.method,
      idempotencyKey: input.idempotencyKey,
    });
    const data = await postJson<{ success: boolean; invoice: unknown }>('/api/billing', body, 'billing');
    return mapInvoice(parseOrThrow(InvoiceSchema, data.invoice, 'billing'));
  },

  async submitFeedback(): Promise<void> {
    // C5 isn't shipped yet; capabilities.feedback is false so the UI never calls this.
    throw new GuestApiError('unsupported', 'Feedback is not available yet.');
  },

  subscribe(): () => void {
    // api-mode liveness is SWR polling (data/hooks.ts) plus, optionally, Supabase Realtime
    // (data/live.ts) — neither goes through this method, so there is nothing to wire up here.
    return () => {};
  },
};
