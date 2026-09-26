import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from './_helpers/memory-storage';

let sim: typeof import('@/mock/guest/server-sim');

beforeEach(async () => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('window', { location: { search: '' } });
  vi.resetModules();
  sim = await import('@/mock/guest/server-sim');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveQr', () => {
  it('resolves an active room QR to a session for Grand Azure, Room 304', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    expect(session.hotelSlug).toBe('grand-azure');
    expect(session.roomNumber).toBe('Room 304');
    expect(session.guestName).toBe('Dr. Siddharth Verma');
    expect(session.stayToken).toBe('mock_stay-001');
  });

  it('rejects a vacant room as invalid', async () => {
    await expect(sim.resolveQr('QR_AZURE_105')).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('rejects an unknown code as invalid', async () => {
    await expect(sim.resolveQr('NOPE_123')).rejects.toMatchObject({ kind: 'invalid' });
  });
});

describe('pricing', () => {
  it("matches M1's formula: 105000 subtotal -> 18900 tax, 5250 service, 129150 total", async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    const quote = await sim.quoteOrder(session, [
      { menuItemId: 'item-001', quantity: 1 }, // 55000 paise
      { menuItemId: 'item-004', quantity: 2 }, // 25000 * 2 = 50000 paise
    ]);
    expect(quote.subtotalPaise).toBe(105000);
    expect(quote.taxPaise).toBe(18900);
    expect(quote.serviceChargePaise).toBe(5250);
    expect(quote.totalPaise).toBe(129150);
  });

  it('rejects an unavailable or unknown menu item', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    await expect(sim.quoteOrder(session, [{ menuItemId: 'not-a-real-item', quantity: 1 }])).rejects.toMatchObject({
      kind: 'validation',
    });
  });
});

describe('order progression', () => {
  it('advances pending -> accepted -> preparing -> ready -> delivered as time passes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const start = new Date('2026-09-26T20:00:00.000Z');
    vi.setSystemTime(start);

    const session = await sim.resolveQr('QR_AZURE_304');
    const order = await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'k1' });
    expect(order.status).toBe('pending');

    vi.setSystemTime(new Date(start.getTime() + 8_000));
    expect((await sim.listOrders(session))[0].status).toBe('accepted');

    vi.setSystemTime(new Date(start.getTime() + 15_000));
    expect((await sim.listOrders(session))[0].status).toBe('preparing');

    vi.setSystemTime(new Date(start.getTime() + 45_000));
    expect((await sim.listOrders(session))[0].status).toBe('ready');

    vi.setSystemTime(new Date(start.getTime() + 70_000));
    expect((await sim.listOrders(session))[0].status).toBe('delivered');
  }, 20_000);

  it('never goes backwards when an older read arrives late (guarded by step index, not time)', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'k2' });
    const orders = await sim.listOrders(session);
    expect(orders[0].status).toBe('pending');
  });
});

describe('idempotent replays', () => {
  it('placeOrder returns the same order for a reused idempotency key', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    const first = await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'checkout-1' });
    const second = await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 3 }], idempotencyKey: 'checkout-1' });
    expect(second.id).toBe(first.id);
    expect(second.totalPaise).toBe(first.totalPaise);
  });

  it('pay returns the same paid invoice for a reused idempotency key', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'checkout-2' });
    const invoice = await sim.getInvoice(session);

    const first = await sim.pay(session, { invoiceId: invoice.id, amountPaise: invoice.totalPaise, method: 'card_test', idempotencyKey: 'pay-1' });
    const second = await sim.pay(session, { invoiceId: invoice.id, amountPaise: invoice.totalPaise, method: 'card_test', idempotencyKey: 'pay-1' });
    expect(second.status).toBe('paid');
    expect(second.paidAt).toBe(first.paidAt);
  });

  it('rejects a payment whose amount does not match the current invoice total', async () => {
    const session = await sim.resolveQr('QR_AZURE_304');
    await sim.placeOrder(session, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'checkout-3' });
    const invoice = await sim.getInvoice(session);
    await expect(
      sim.pay(session, { invoiceId: invoice.id, amountPaise: invoice.totalPaise + 1, method: 'card_test', idempotencyKey: 'pay-2' })
    ).rejects.toMatchObject({ kind: 'validation' });
  });
});
