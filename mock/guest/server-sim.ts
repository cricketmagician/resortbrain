// mock/guest/server-sim.ts
// A stand-in for M1's API. This is the ONLY place in the guest client allowed to compute money —
// it copies M1's formula exactly (server/db.ts createOrder): subtotal = Σ unit × qty,
// tax = round(subtotal × taxRate / 100), service = round(subtotal × serviceCharge / 100),
// total = subtotal + tax + service. Everywhere else in the guest app, prices are values this
// module (or the real API) already computed.

import { GUEST_HOTELS_SEED, GUEST_MENU_SEED } from '@/db/seed/guest/guest_seed';
import { GuestApiError, type GuestApiErrorKind } from '@/lib/guest/data/types';
import type {
  CartLine,
  GuestSession,
  Invoice,
  Order,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Quote,
  RequestCategory,
  RequestPriority,
  RequestStatus,
  ServiceRequest,
  StayEvent,
} from '@/lib/guest/types';
import { findStayById, findStayByQrToken, MOCK_HOTELS_BY_ID } from './fixtures';

const STORAGE_KEY = 'rb.mock.v1';

// ---------------------------------------------------------------------------
// Persisted state
// ---------------------------------------------------------------------------

interface MockOrderRecord {
  id: string;
  stayId: string;
  hotelId: string;
  roomNumber: string;
  orderNumber: string;
  lines: OrderLine[];
  subtotalPaise: number;
  taxPaise: number;
  serviceChargePaise: number;
  totalPaise: number;
  specialInstructions?: string;
  idempotencyKey?: string;
  createdAt: string;
}

interface MockRequestRecord {
  id: string;
  stayId: string;
  hotelId: string;
  roomNumber: string;
  category: RequestCategory;
  title: string;
  details?: string;
  priority: RequestPriority;
  slaMinutes: number;
  createdAt: string;
}

// Department SLA tiers (playbook §5) — mirrors what M1 derives server-side from category/priority.
const REQUEST_SLA_MINUTES: Record<RequestCategory, number> = {
  front_desk: 10,
  amenities: 15,
  housekeeping: 20,
  maintenance: 30,
};

interface MockInvoiceRecord {
  id: string;
  stayId: string;
  invoiceNumber: string;
  status: 'issued' | 'paid';
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  paidTotalPaise?: number;
}

interface MockPaymentRecord {
  idempotencyKey: string;
  invoiceId: string;
}

interface MockFeedbackRecord {
  invoiceId?: string;
  orderId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  comment?: string;
  createdAt: string;
}

interface MockState {
  orders: MockOrderRecord[];
  requests: MockRequestRecord[];
  invoices: MockInvoiceRecord[];
  payments: MockPaymentRecord[];
  feedback: MockFeedbackRecord[];
}

function emptyState(): MockState {
  return { orders: [], requests: [], invoices: [], payments: [], feedback: [] };
}

let resetHandled = false;

function shouldReset(): boolean {
  if (typeof window === 'undefined' || resetHandled) return false;
  resetHandled = true;
  return new URLSearchParams(window.location.search).get('mock') === 'reset';
}

function loadState(): MockState {
  if (typeof window === 'undefined') return emptyState();
  if (shouldReset()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return emptyState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<MockState>;
    return {
      orders: parsed.orders ?? [],
      requests: parsed.requests ?? [],
      invoices: parsed.invoices ?? [],
      payments: parsed.payments ?? [],
      feedback: parsed.feedback ?? [],
    };
  } catch {
    return emptyState();
  }
}

function saveState(state: MockState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore — this tab keeps working from memory for the rest of the session
  }
}

// ---------------------------------------------------------------------------
// Simulated latency and chaos mode (?chaos=1 fails 20% of calls)
// ---------------------------------------------------------------------------

function isChaosMode(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('chaos') === '1';
}

function simSpeedDivisor(): number {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sim') === 'fast' ? 5 : 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateNetwork(): Promise<void> {
  await sleep(250 + Math.random() * 400);
  if (isChaosMode() && Math.random() < 0.2) {
    const kinds: GuestApiErrorKind[] = ['network', 'timeout', 'server', 'rate_limited'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    throw new GuestApiError(kind, `Simulated ${kind} failure (chaos mode).`, kind === 'rate_limited' ? 8 : undefined);
  }
}

// ---------------------------------------------------------------------------
// Pricing — the one place in the guest client allowed to do this arithmetic
// ---------------------------------------------------------------------------

function priceLines(hotelId: string, lines: CartLine[]) {
  const hotel = GUEST_HOTELS_SEED.find((h) => h.id === hotelId);
  if (!hotel) throw new GuestApiError('server', 'Unknown hotel.');

  const orderLines: OrderLine[] = [];
  let subtotalPaise = 0;

  for (const line of lines) {
    const item = GUEST_MENU_SEED.find((i) => i.id === line.menuItemId && i.hotel_id === hotelId);
    if (!item) throw new GuestApiError('validation', `${line.menuItemId} is no longer available.`);
    if (!item.is_available) throw new GuestApiError('validation', `${item.name} is no longer available.`);
    if (line.quantity <= 0) throw new GuestApiError('validation', 'Quantity must be greater than zero.');

    const totalPricePaise = item.price_paise * line.quantity;
    subtotalPaise += totalPricePaise;
    orderLines.push({ menuItemId: item.id, name: item.name, quantity: line.quantity, unitPricePaise: item.price_paise, totalPricePaise });
  }

  const taxPaise = Math.round((subtotalPaise * hotel.tax_rate_percent) / 100);
  const serviceChargePaise = Math.round((subtotalPaise * hotel.service_charge_percent) / 100);
  const totalPaise = subtotalPaise + taxPaise + serviceChargePaise;

  return { lines: orderLines, subtotalPaise, taxPaise, serviceChargePaise, totalPaise };
}

// ---------------------------------------------------------------------------
// Time-based progression — status is a pure function of createdAt, so it survives reloads
// ---------------------------------------------------------------------------

const ORDER_THRESHOLDS_SEC: Array<[number, OrderStatus]> = [
  [70, 'delivered'],
  [45, 'ready'],
  [15, 'preparing'],
  [8, 'accepted'],
];

const REQUEST_THRESHOLDS_SEC: Array<[number, RequestStatus]> = [
  [60, 'completed'],
  [25, 'in_progress'],
  [10, 'acknowledged'],
];

function addSeconds(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function computeOrderState(createdAt: string, now: number, divisor: number): { status: OrderStatus; updatedAt: string } {
  const elapsedSec = (now - new Date(createdAt).getTime()) / 1000;
  for (const [thresholdSec, status] of ORDER_THRESHOLDS_SEC) {
    const scaled = thresholdSec / divisor;
    if (elapsedSec >= scaled) return { status, updatedAt: addSeconds(createdAt, scaled) };
  }
  return { status: 'pending', updatedAt: createdAt };
}

function computeRequestState(
  createdAt: string,
  now: number,
  divisor: number
): { status: RequestStatus; acknowledgedAt?: string; completedAt?: string; assigneeFirstName?: string } {
  const elapsedSec = (now - new Date(createdAt).getTime()) / 1000;
  const acknowledgedAtSec = REQUEST_THRESHOLDS_SEC[2][0] / divisor;

  for (const [thresholdSec, status] of REQUEST_THRESHOLDS_SEC) {
    const scaled = thresholdSec / divisor;
    if (elapsedSec >= scaled) {
      return {
        status,
        acknowledgedAt: addSeconds(createdAt, acknowledgedAtSec),
        completedAt: status === 'completed' ? addSeconds(createdAt, scaled) : undefined,
        assigneeFirstName: 'Rajesh',
      };
    }
  }
  return { status: 'created' };
}

function mapOrder(record: MockOrderRecord, now: number, divisor: number): Order {
  const { status, updatedAt } = computeOrderState(record.createdAt, now, divisor);
  return {
    id: record.id,
    orderNumber: record.orderNumber,
    status,
    roomNumber: record.roomNumber,
    lines: record.lines,
    subtotalPaise: record.subtotalPaise,
    taxPaise: record.taxPaise,
    serviceChargePaise: record.serviceChargePaise,
    totalPaise: record.totalPaise,
    specialInstructions: record.specialInstructions,
    createdAt: record.createdAt,
    updatedAt,
  };
}

function mapRequest(record: MockRequestRecord, now: number, divisor: number): ServiceRequest {
  const { status, acknowledgedAt, completedAt, assigneeFirstName } = computeRequestState(record.createdAt, now, divisor);
  return {
    id: record.id,
    category: record.category,
    title: record.title,
    details: record.details,
    status,
    priority: record.priority,
    roomNumber: record.roomNumber,
    assigneeFirstName: status === 'created' ? undefined : assigneeFirstName,
    slaMinutes: record.slaMinutes,
    createdAt: record.createdAt,
    acknowledgedAt,
    completedAt,
  };
}

function ordersForStay(stayId: string): MockOrderRecord[] {
  return loadState().orders.filter((o) => o.stayId === stayId);
}

function requestsForStay(stayId: string): MockRequestRecord[] {
  return loadState().requests.filter((r) => r.stayId === stayId);
}

// ---------------------------------------------------------------------------
// Public simulator API — mirrors GuestApi's business methods (lib/guest/data/mock.ts adapts
// this to the exact interface, including session-shape and event-subscription plumbing).
// ---------------------------------------------------------------------------

function newId(prefix: string): string {
  return `mock_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// Derived from persisted state rather than a module-level counter, so a page reload (which
// re-initialises this module) never reissues a number that's already on an earlier order/invoice.
function nextSequenceNumber(existingNumbers: string[], prefix: string, start: number): string {
  const max = existingNumbers.reduce((highest, value) => {
    if (!value.startsWith(prefix)) return highest;
    const n = Number(value.slice(prefix.length));
    return Number.isFinite(n) && n > highest ? n : highest;
  }, start);
  return `${prefix}${max + 1}`;
}

export async function resolveQr(qrToken: string): Promise<GuestSession> {
  await simulateNetwork();
  const stay = findStayByQrToken(qrToken);
  if (!stay) throw new GuestApiError('invalid', "This code isn't active.");
  return buildSession(stay.id);
}

export async function resumeSession(session: GuestSession): Promise<GuestSession> {
  await simulateNetwork();
  const stayId = session.stayToken.replace(/^mock_/, '');
  const stay = findStayById(stayId);
  if (!stay) throw new GuestApiError('expired', 'This stay has ended.');
  return buildSession(stay.id);
}

function buildSession(stayId: string): GuestSession {
  const stay = findStayById(stayId);
  if (!stay) throw new GuestApiError('invalid', 'This stay is no longer active.');
  const hotel = MOCK_HOTELS_BY_ID.get(stay.hotelId);
  if (!hotel) throw new GuestApiError('server', 'Unknown hotel.');
  return {
    stayToken: `mock_${stay.id}`,
    stayId: stay.id,
    hotelId: stay.hotelId,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    roomId: stay.roomId,
    roomNumber: stay.roomNumber,
    guestName: stay.guestName,
    currency: hotel.currency,
    validatedAt: new Date().toISOString(),
  };
}

export async function quoteOrder(session: GuestSession, lines: CartLine[]): Promise<Quote> {
  await simulateNetwork();
  const { subtotalPaise, taxPaise, serviceChargePaise, totalPaise } = priceLines(session.hotelId, lines);
  return { subtotalPaise, taxPaise, serviceChargePaise, totalPaise };
}

export async function placeOrder(
  session: GuestSession,
  input: { lines: CartLine[]; specialInstructions?: string; idempotencyKey: string }
): Promise<Order> {
  await simulateNetwork();
  const state = loadState();

  const existing = state.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
  if (existing) return mapOrder(existing, Date.now(), simSpeedDivisor());

  const priced = priceLines(session.hotelId, input.lines);
  const record: MockOrderRecord = {
    id: newId('ord'),
    stayId: session.stayId,
    hotelId: session.hotelId,
    roomNumber: session.roomNumber,
    orderNumber: nextSequenceNumber(state.orders.map((o) => o.orderNumber), 'RB-', 1000),
    lines: priced.lines,
    subtotalPaise: priced.subtotalPaise,
    taxPaise: priced.taxPaise,
    serviceChargePaise: priced.serviceChargePaise,
    totalPaise: priced.totalPaise,
    specialInstructions: input.specialInstructions,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  state.orders.unshift(record);
  saveState(state);
  return mapOrder(record, Date.now(), simSpeedDivisor());
}

export async function listOrders(session: GuestSession): Promise<Order[]> {
  await simulateNetwork();
  const now = Date.now();
  const divisor = simSpeedDivisor();
  return ordersForStay(session.stayId)
    .map((o) => mapOrder(o, now, divisor))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createRequest(
  session: GuestSession,
  input: { category: RequestCategory; title: string; details?: string; priority: RequestPriority }
): Promise<ServiceRequest> {
  await simulateNetwork();
  const state = loadState();
  const record: MockRequestRecord = {
    id: newId('req'),
    stayId: session.stayId,
    hotelId: session.hotelId,
    roomNumber: session.roomNumber,
    category: input.category,
    title: input.title,
    details: input.details,
    priority: input.priority,
    slaMinutes: REQUEST_SLA_MINUTES[input.category],
    createdAt: new Date().toISOString(),
  };
  state.requests.unshift(record);
  saveState(state);
  return mapRequest(record, Date.now(), simSpeedDivisor());
}

export async function listRequests(session: GuestSession): Promise<ServiceRequest[]> {
  await simulateNetwork();
  const now = Date.now();
  const divisor = simSpeedDivisor();
  return requestsForStay(session.stayId)
    .map((r) => mapRequest(r, now, divisor))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Mutates `state.invoices` in place — callers must saveState(state) themselves afterwards, so
 *  every read-modify-write in this module (notably pay()) commits to the same state object. */
function findOrCreateInvoiceRecord(state: MockState, stayId: string): MockInvoiceRecord {
  let record = state.invoices.find((i) => i.stayId === stayId);
  if (!record) {
    record = { id: newId('inv'), stayId, invoiceNumber: nextSequenceNumber(state.invoices.map((i) => i.invoiceNumber), 'INV-2026-', 4800), status: 'issued' };
    state.invoices.push(record);
  }
  return record;
}

function computeInvoiceFromState(state: MockState, session: GuestSession): Invoice {
  const now = Date.now();
  const divisor = simSpeedDivisor();
  const record = findOrCreateInvoiceRecord(state, session.stayId);
  const orders = state.orders
    .filter((o) => o.stayId === session.stayId)
    .map((o) => mapOrder(o, now, divisor))
    .filter((o) => o.status !== 'cancelled');

  const subtotalPaise = orders.reduce((sum, o) => sum + o.subtotalPaise, 0);
  const taxPaise = orders.reduce((sum, o) => sum + o.taxPaise, 0);
  const serviceChargePaise = orders.reduce((sum, o) => sum + o.serviceChargePaise, 0);
  const computedTotalPaise = subtotalPaise + taxPaise + serviceChargePaise;

  if (record.status === 'paid') {
    return {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      status: 'paid',
      subtotalPaise,
      taxPaise,
      serviceChargePaise,
      discountPaise: 0,
      totalPaise: record.paidTotalPaise ?? computedTotalPaise,
      createdAt: orders[orders.length - 1]?.createdAt ?? new Date().toISOString(),
      paidAt: record.paidAt,
      paymentMethod: record.paymentMethod,
    };
  }

  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    status: 'issued',
    subtotalPaise,
    taxPaise,
    serviceChargePaise,
    discountPaise: 0,
    totalPaise: computedTotalPaise,
    createdAt: orders[orders.length - 1]?.createdAt ?? new Date().toISOString(),
  };
}

export async function getInvoice(session: GuestSession): Promise<Invoice> {
  await simulateNetwork();
  const state = loadState();
  const invoice = computeInvoiceFromState(state, session);
  saveState(state); // persists a newly-minted invoice number so it doesn't change between reads
  return invoice;
}

export async function pay(
  session: GuestSession,
  input: { invoiceId: string; amountPaise: number; method: PaymentMethod; idempotencyKey: string }
): Promise<Invoice> {
  await simulateNetwork();
  const state = loadState();

  const existingPayment = state.payments.find((p) => p.idempotencyKey === input.idempotencyKey);
  if (existingPayment) {
    const invoice = computeInvoiceFromState(state, session);
    saveState(state);
    return invoice;
  }

  const current = computeInvoiceFromState(state, session);
  if (input.amountPaise !== current.totalPaise) {
    throw new GuestApiError('validation', 'The amount to pay has changed. Please review your bill and try again.');
  }

  const invoiceRecord = findOrCreateInvoiceRecord(state, session.stayId);
  invoiceRecord.status = 'paid';
  invoiceRecord.paymentMethod = input.method;
  invoiceRecord.paidAt = new Date().toISOString();
  invoiceRecord.paidTotalPaise = input.amountPaise;
  state.payments.push({ idempotencyKey: input.idempotencyKey, invoiceId: invoiceRecord.id });

  const invoice = computeInvoiceFromState(state, session);
  saveState(state);
  return invoice;
}

export async function submitFeedback(
  session: GuestSession,
  input: { invoiceId?: string; orderId?: string; rating: 1 | 2 | 3 | 4 | 5; tags: string[]; comment?: string }
): Promise<void> {
  await simulateNetwork();
  const state = loadState();
  state.feedback.push({ ...input, createdAt: new Date().toISOString() });
  saveState(state);
}

/** Polls persisted orders/requests for this stay and fires a StayEvent on every status change. */
export function subscribeToStay(stayId: string, onEvent: (event: StayEvent) => void): () => void {
  const lastKnown = new Map<string, string>();
  let initialized = false;

  function tick() {
    const now = Date.now();
    const divisor = simSpeedDivisor();

    for (const order of ordersForStay(stayId)) {
      const { status } = computeOrderState(order.createdAt, now, divisor);
      const key = `order:${order.id}`;
      const prev = lastKnown.get(key);
      lastKnown.set(key, status);
      if (initialized && prev !== status) onEvent({ entity: 'order', id: order.id, status });
    }

    for (const request of requestsForStay(stayId)) {
      const { status } = computeRequestState(request.createdAt, now, divisor);
      const key = `request:${request.id}`;
      const prev = lastKnown.get(key);
      lastKnown.set(key, status);
      if (initialized && prev !== status) onEvent({ entity: 'request', id: request.id, status });
    }

    initialized = true;
  }

  tick();
  const interval = setInterval(tick, 2000);
  return () => clearInterval(interval);
}
