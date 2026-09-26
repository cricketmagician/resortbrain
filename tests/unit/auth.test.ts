// tests/unit/auth.test.ts
import { describe, it, expect } from 'vitest';
import { createStayToken, verifyStayToken } from '@/server/auth';

describe('Cryptographic Stay Token Security', () => {
  const sampleStay = {
    stayId: 'stay_test_101',
    hotelId: 'hotel-001',
    hotelSlug: 'the-grand-heritage',
    roomId: 'room-304',
    roomNumber: '304',
    guestId: 'guest-101',
    guestName: 'Sir Alexander',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  };

  it('generates a valid signed stay token that verifies with matching secret', () => {
    const token = createStayToken(sampleStay);
    expect(token.startsWith('rb_')).toBe(true);

    const session = verifyStayToken(token);
    expect(session).not.toBeNull();
    expect(session?.stayId).toBe('stay_test_101');
    expect(session?.hotelId).toBe('hotel-001');
    expect(session?.hotelSlug).toBe('the-grand-heritage');
  });

  it('rejects tokens signed with a different secret key (tamper protection)', () => {
    const token = createStayToken(sampleStay, 'secret_key_alpha');
    const verifiedWithBeta = verifyStayToken(token, 'secret_key_beta');
    expect(verifiedWithBeta).toBeNull();
  });

  it('rejects tampered payloads', () => {
    const token = createStayToken(sampleStay);
    const parts = token.slice(3).split('.');
    // Tamper with payload by changing hotelId to hotel-002
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...sampleStay, hotelId: 'hotel-002' })
    ).toString('base64url');
    const tamperedToken = `rb_${tamperedPayload}.${parts[1]}`;

    const verified = verifyStayToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('verifies seeded demo tokens via database lookup', () => {
    const session = verifyStayToken('stay_token_live_demo_room_304');
    expect(session).not.toBeNull();
    expect(session?.hotelId).toBe('hotel-001');
    expect(session?.roomNumber).toContain('304');
  });
});
