// tests/unit/pricing.test.ts
// Unit tests for server-authoritative pricing, minor units, and tax calculation

import { describe, it, expect } from 'vitest';
import { db } from '@/server/db';

describe('Server-Authoritative Pricing & Money Engine', () => {
  it('correctly calculates subtotal, 18% GST, and 5% service charge in integer minor units (paise)', () => {
    const order = db.createOrder({
      hotelId: 'hotel-001',
      stayId: 'stay-001',
      items: [
        { menuItemId: 'item-001', quantity: 2 }, // Avocado Tartine: 55000 * 2 = 110000 paise
        { menuItemId: 'item-004', quantity: 1 }, // Coconut Water: 25000 * 1 = 25000 paise
      ],
    });

    const expectedSubtotal = 110000 + 25000; // 135000 paise (₹1350)
    const expectedTax = Math.round((135000 * 18) / 100); // 24300 paise (₹243)
    const expectedServiceCharge = Math.round((135000 * 5) / 100); // 6750 paise (₹67.50)
    const expectedTotal = expectedSubtotal + expectedTax + expectedServiceCharge; // 166050 paise (₹1660.50)

    expect(order.subtotal_paise).toBe(expectedSubtotal);
    expect(order.tax_paise).toBe(expectedTax);
    expect(order.service_charge_paise).toBe(expectedServiceCharge);
    expect(order.total_paise).toBe(expectedTotal);
  });

  it('rejects order with zero or negative item quantity', () => {
    expect(() =>
      db.createOrder({
        hotelId: 'hotel-001',
        stayId: 'stay-001',
        items: [{ menuItemId: 'item-001', quantity: 0 }],
      })
    ).toThrowError(/Quantity must be greater than zero/);
  });

  it('rejects order with item belonging to a different hotel tenant', () => {
    expect(() =>
      db.createOrder({
        hotelId: 'hotel-001',
        stayId: 'stay-001',
        items: [{ menuItemId: 'item-201', quantity: 1 }], // item-201 belongs to hotel-002
      })
    ).toThrowError(/does not exist in this hotel/);
  });

  it('respects idempotency key and prevents duplicate billing', () => {
    const key = `idem_${Date.now()}_test`;
    const order1 = db.createOrder({
      hotelId: 'hotel-001',
      stayId: 'stay-001',
      items: [{ menuItemId: 'item-001', quantity: 1 }],
      idempotencyKey: key,
    });

    const order2 = db.createOrder({
      hotelId: 'hotel-001',
      stayId: 'stay-001',
      items: [{ menuItemId: 'item-001', quantity: 1 }],
      idempotencyKey: key,
    });

    expect(order1.id).toBe(order2.id);
  });
});
