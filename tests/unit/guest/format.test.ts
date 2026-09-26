import { describe, expect, it } from 'vitest';
import { formatDateTime, formatMoney, formatRelative, formatTime } from '@/lib/guest/format';

describe('formatMoney', () => {
  it('drops decimals for whole rupees', () => {
    expect(formatMoney(55000)).toBe('₹550');
  });

  it('keeps decimals when paise are not a whole rupee', () => {
    expect(formatMoney(129150)).toBe('₹1,291.50');
  });

  it('uses en-IN lakh grouping', () => {
    expect(formatMoney(10_000_000)).toBe('₹1,00,000');
  });
});

describe('formatTime and formatDateTime', () => {
  const iso = '2026-09-26T14:32:00.000Z'; // 8:02 PM IST

  it('formats a time in the given time zone', () => {
    expect(formatTime(iso, 'Asia/Kolkata')).toBe('8:02 PM');
  });

  it('formats a date and time in the given time zone', () => {
    expect(formatDateTime(iso, 'Asia/Kolkata')).toBe('26 Sep 2026, 8:02 PM');
  });
});

describe('formatRelative', () => {
  const now = Date.parse('2026-09-26T20:10:00.000Z');

  it('says "Just now" for very recent times', () => {
    expect(formatRelative(new Date(now - 10_000).toISOString(), now)).toBe('Just now');
  });

  it('shows minutes for under an hour', () => {
    expect(formatRelative(new Date(now - 6 * 60_000).toISOString(), now)).toBe('6 min ago');
  });

  it('shows hours for under a day', () => {
    expect(formatRelative(new Date(now - 3 * 60 * 60_000).toISOString(), now)).toBe('3 h ago');
  });

  it('shows days beyond that', () => {
    expect(formatRelative(new Date(now - 2 * 24 * 60 * 60_000).toISOString(), now)).toBe('2 d ago');
  });
});
