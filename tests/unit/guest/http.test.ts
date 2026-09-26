import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpApi } from '@/lib/guest/data/http';
import type { GuestSession } from '@/lib/guest/types';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

const SESSION: GuestSession = {
  stayToken: 'rb_abc',
  stayId: 'stay-001',
  hotelId: 'hotel-001',
  hotelSlug: 'grand-azure',
  hotelName: 'Grand Azure Resort & Spa',
  roomId: 'room-103',
  roomNumber: 'Room 304',
  guestName: 'Dr. Siddharth Verma',
  currency: 'INR',
  validatedAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('navigator', { onLine: true });
});

describe('resolveQr', () => {
  it('maps the snake_case session and fills hotelSlug from the directory', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        session: {
          stayId: 'stay-001',
          hotelId: 'hotel-001',
          hotelName: 'Grand Azure Resort & Spa',
          roomId: 'room-103',
          roomNumber: 'Room 304',
          guestName: 'Dr. Siddharth Verma',
          stayToken: 'rb_abc',
          currency: 'INR',
          taxRate: 18,
          serviceCharge: 5,
        },
      })
    );

    const session = await httpApi.resolveQr('QR_AZURE_304');
    expect(session.hotelSlug).toBe('grand-azure');
    expect(session.stayId).toBe('stay-001');
    expect(session.roomNumber).toBe('Room 304');
  });

  it('maps a 404 to an invalid error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(404, { error: 'Not found' }));
    await expect(httpApi.resolveQr('QR_NOPE')).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('rejects a malformed session with a server error rather than rendering bad data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { success: true, session: { stayId: 'stay-001' } }));
    await expect(httpApi.resolveQr('QR_AZURE_304')).rejects.toMatchObject({ kind: 'server' });
  });
});

describe('error status mapping', () => {
  it('maps 429 to rate_limited using Retry-After', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(429, { error: 'Slow down' }, { 'Retry-After': '7' }));
    await expect(httpApi.listOrders(SESSION)).rejects.toMatchObject({ kind: 'rate_limited', retryAfterSec: 7 });
  });

  it('maps 401 to expired', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));
    await expect(httpApi.listOrders(SESSION)).rejects.toMatchObject({ kind: 'expired' });
  });

  it('maps a 400 naming an invalid or expired token to expired', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(400, { error: 'Invalid or expired stay token' }));
    await expect(
      httpApi.placeOrder(SESSION, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'k1' })
    ).rejects.toMatchObject({ kind: 'expired' });
  });

  it('maps an ordinary 400 to validation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(400, { error: 'Quantity must be greater than zero.' }));
    await expect(
      httpApi.placeOrder(SESSION, { lines: [{ menuItemId: 'item-001', quantity: 0 }], idempotencyKey: 'k1' })
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('maps a 500 to server, after exhausting the GET retry budget', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, { error: 'Boom' }));
    await expect(httpApi.listOrders(SESSION)).rejects.toMatchObject({ kind: 'server' });
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 10_000);

  it('fails fast with network when the browser is offline, without calling fetch', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    await expect(httpApi.listOrders(SESSION)).rejects.toMatchObject({ kind: 'network' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('mapping snake_case to camelCase', () => {
  it('maps an order, including item names and totals', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(201, {
        success: true,
        order: {
          id: 'ord-1',
          order_number: 'RB-1001',
          status: 'pending',
          room_number: 'Room 304',
          items: [
            { menuItemId: 'item-001', itemName: 'Avocado Tartine', quantity: 2, unitPricePaise: 55000, totalPricePaise: 110000 },
          ],
          subtotal_paise: 110000,
          tax_paise: 19800,
          service_charge_paise: 5500,
          total_paise: 135300,
          created_at: '2026-09-26T14:00:00.000Z',
          updated_at: '2026-09-26T14:00:00.000Z',
        },
      })
    );

    const order = await httpApi.placeOrder(SESSION, { lines: [{ menuItemId: 'item-001', quantity: 2 }], idempotencyKey: 'k1' });
    expect(order.orderNumber).toBe('RB-1001');
    expect(order.lines[0]).toMatchObject({ name: 'Avocado Tartine', menuItemId: 'item-001', totalPricePaise: 110000 });
    expect(order.totalPaise).toBe(135300);
  });

  it('takes only the assignee\'s first name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(201, {
        success: true,
        request: {
          id: 'req-1',
          room_number: 'Room 304',
          category: 'housekeeping',
          title: 'Extra towels',
          status: 'acknowledged',
          priority: 'normal',
          assigned_name: 'Rajesh Kumar',
          created_at: '2026-09-26T14:00:00.000Z',
          acknowledged_at: '2026-09-26T14:02:00.000Z',
        },
      })
    );

    const request = await httpApi.createRequest(SESSION, { category: 'housekeeping', title: 'Extra towels', priority: 'normal' });
    expect(request.assigneeFirstName).toBe('Rajesh');
  });
});

describe('GET retries', () => {
  it('retries an idempotent GET on a network failure and succeeds', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(jsonResponse(200, { orders: [] }));

    const orders = await httpApi.listOrders(SESSION);
    expect(orders).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('never retries a POST automatically', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(
      httpApi.placeOrder(SESSION, { lines: [{ menuItemId: 'item-001', quantity: 1 }], idempotencyKey: 'k1' })
    ).rejects.toMatchObject({ kind: 'network' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
