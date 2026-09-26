import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from './_helpers/memory-storage';

let idempotency: typeof import('@/lib/guest/idempotency');

beforeEach(async () => {
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  vi.resetModules();
  idempotency = await import('@/lib/guest/idempotency');
});

describe('forCheckout', () => {
  it('returns the same key for the same cart hash', () => {
    const first = idempotency.forCheckout('stay-1', 'hash-a');
    const second = idempotency.forCheckout('stay-1', 'hash-a');
    expect(second).toBe(first);
  });

  it('mints a new key when the cart hash changes', () => {
    const first = idempotency.forCheckout('stay-1', 'hash-a');
    const second = idempotency.forCheckout('stay-1', 'hash-b');
    expect(second).not.toBe(first);
  });

  it('settle() clears the stored key so the next checkout gets a fresh one', () => {
    const first = idempotency.forCheckout('stay-1', 'hash-a');
    idempotency.settle('checkout', 'stay-1');
    const second = idempotency.forCheckout('stay-1', 'hash-a');
    expect(second).not.toBe(first);
  });
});

describe('forPayment', () => {
  it('returns the same key on repeated calls for the same invoice', () => {
    const first = idempotency.forPayment('inv-1');
    const second = idempotency.forPayment('inv-1');
    expect(second).toBe(first);
  });

  it('keeps separate keys for separate invoices', () => {
    const first = idempotency.forPayment('inv-1');
    const second = idempotency.forPayment('inv-2');
    expect(second).not.toBe(first);
  });

  it('settle() clears the stored key', () => {
    const first = idempotency.forPayment('inv-1');
    idempotency.settle('payment', 'inv-1');
    const second = idempotency.forPayment('inv-1');
    expect(second).not.toBe(first);
  });
});
