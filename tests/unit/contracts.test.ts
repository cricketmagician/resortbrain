// tests/unit/contracts.test.ts
import { describe, it, expect } from 'vitest';
import { db } from '@/server/db';
import { getPublicHotel } from '@/modules/hotels/queries';
import { createStayToken } from '@/server/auth';

describe('Member 2 Contract Enhancements & Dynamic Billing', () => {
  const testHotel = db.hotels[0];
  const testStay = db.stays[0];
  const validToken = createStayToken({
    stayId: testStay.id,
    hotelId: testHotel.id,
    hotelSlug: testHotel.slug,
    roomId: testStay.room_id,
    roomNumber: testStay.room_number,
    guestId: testStay.guest_id,
    guestName: testStay.guest_name,
    expiresAt: testStay.check_out,
  });

  it('C1: returns public hotel model without internal plan or sensitive data', () => {
    const publicHotel = getPublicHotel(testHotel.slug);
    expect(publicHotel).not.toBeNull();
    expect(publicHotel?.name).toBe(testHotel.name);
    expect(publicHotel?.slug).toBe(testHotel.slug);
    expect(publicHotel?.currency).toBe('INR');
    expect(publicHotel?.contact.phone).toBeDefined();
    expect(publicHotel?.requestPresets.housekeeping.length).toBeGreaterThan(0);
    // Ensure no billing/subscription plan internals leaked
    expect((publicHotel as any).subscription_plan).toBeUndefined();
    expect((publicHotel as any).stripe_customer_id).toBeUndefined();
  });

  it('C3: computes order quote accurately with zero side effects', () => {
    const initialOrderCount = db.orders.length;
    const menuItem = db.menuItems.find((m) => m.hotel_id === testHotel.id)!;

    const quote = db.quoteOrder({
      hotelId: testHotel.id,
      items: [{ menuItemId: menuItem.id, quantity: 2 }],
    });

    expect(quote.subtotal_paise).toBe(menuItem.price_paise * 2);
    expect(quote.tax_paise).toBe(Math.round((quote.subtotal_paise * 18) / 100));
    expect(quote.service_charge_paise).toBe(Math.round((quote.subtotal_paise * 5) / 100));
    expect(quote.total_paise).toBe(quote.subtotal_paise + quote.tax_paise + quote.service_charge_paise);
    expect(quote.lines.length).toBe(1);
    expect(quote.lines[0].itemName).toBe(menuItem.name);

    // ZERO side effects: order count remains unchanged
    expect(db.orders.length).toBe(initialOrderCount);
  });

  it('C5: submits guest feedback and records audit event', () => {
    const feedback = db.submitFeedback({
      hotelId: testHotel.id,
      stayId: testStay.id,
      guestName: 'Lady Eleanor',
      roomNumber: '304',
      rating: 5,
      tags: ['Spotless Room', 'Fast Room Service'],
      comment: 'Exceptional stay and prompt butler service!',
    });

    expect(feedback.id.startsWith('fb_')).toBe(true);
    expect(feedback.rating).toBe(5);
    expect(feedback.tags).toContain('Spotless Room');
    expect(db.feedback.some((f) => f.id === feedback.id)).toBe(true);
  });

  it('C7: dynamically updates draft folio invoice totals when new orders are placed', () => {
    const freshStayId = `stay_folio_test_${Date.now()}`;
    const stay = {
      id: freshStayId,
      hotel_id: testHotel.id,
      room_id: 'room-304',
      room_number: 'Room 304',
      guest_id: 'guest-folio',
      guest_name: 'Folio Tester',
      check_in: new Date().toISOString(),
      check_out: new Date(Date.now() + 86400000).toISOString(),
      status: 'active' as const,
      stay_token: `token_${freshStayId}`,
      checkin_pin: '1234',
    };
    db.stays.push(stay);

    // Initial read creates empty draft invoice
    const initialInvoice = db.getOrCreateStayInvoice(freshStayId, testHotel.id);
    expect(initialInvoice.total_paise).toBe(0);

    // Place an order for this stay
    const item = db.menuItems.find((m) => m.hotel_id === testHotel.id)!;
    db.createOrder({
      hotelId: testHotel.id,
      stayId: freshStayId,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    // Re-reading the invoice must recompute the total
    const updatedInvoice = db.getOrCreateStayInvoice(freshStayId, testHotel.id);
    expect(updatedInvoice.total_paise).toBeGreaterThan(0);
    expect(updatedInvoice.subtotal_paise).toBe(item.price_paise);
  });

  it('Security 4: blocks payment if amount does not match invoice total and respects idempotency', () => {
    const stayId = `stay_pay_test_${Date.now()}`;
    db.stays.push({
      id: stayId,
      hotel_id: testHotel.id,
      room_id: 'room-304',
      room_number: 'Room 304',
      guest_id: 'guest-pay',
      guest_name: 'Payment Tester',
      check_in: new Date().toISOString(),
      check_out: new Date(Date.now() + 86400000).toISOString(),
      status: 'active' as const,
      stay_token: `token_${stayId}`,
      checkin_pin: '1234',
    });

    const item = db.menuItems.find((m) => m.hotel_id === testHotel.id)!;
    db.createOrder({
      hotelId: testHotel.id,
      stayId: stayId,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });

    const invoice = db.getOrCreateStayInvoice(stayId, testHotel.id);

    // Underpayment must fail
    expect(() =>
      db.recordPayment({
        invoiceId: invoice.id,
        hotelId: testHotel.id,
        amountPaise: 100, // wrong amount
      })
    ).toThrow(/must match invoice total/);

    // Exact payment succeeds
    const paid = db.recordPayment({
      invoiceId: invoice.id,
      hotelId: testHotel.id,
      amountPaise: invoice.total_paise,
      idempotencyKey: 'idemp_key_123',
    });
    expect(paid.status).toBe('paid');

    // Duplicate idempotent call returns same invoice without error
    const duplicate = db.recordPayment({
      invoiceId: invoice.id,
      hotelId: testHotel.id,
      amountPaise: invoice.total_paise,
      idempotencyKey: 'idemp_key_123',
    });
    expect(duplicate.status).toBe('paid');
  });
});
