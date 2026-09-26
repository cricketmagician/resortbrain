'use client';

// lib/guest/idempotency.ts
// One idempotency key per checkout or payment attempt, reused across retries of the SAME
// contents so a double tap or a retried timeout never creates a duplicate order or payment.

interface StoredKey {
  hash: string;
  key: string;
}

function readKey(storageKey: string): StoredKey | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredKey) : null;
  } catch {
    return null;
  }
}

function writeKey(storageKey: string, value: StoredKey): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // ignore — worst case a retry mints a fresh key, which is still safe, just not deduped
  }
}

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function forCheckout(stayId: string, hash: string): string {
  const storageKey = `rb.idem.checkout.${stayId}`;
  const existing = readKey(storageKey);
  if (existing && existing.hash === hash) return existing.key;
  const key = newKey();
  writeKey(storageKey, { hash, key });
  return key;
}

export function forPayment(invoiceId: string): string {
  const storageKey = `rb.idem.payment.${invoiceId}`;
  const existing = readKey(storageKey);
  if (existing) return existing.key;
  const key = newKey();
  writeKey(storageKey, { hash: invoiceId, key });
  return key;
}

export function settle(kind: 'checkout' | 'payment', id: string): void {
  const storageKey = kind === 'checkout' ? `rb.idem.checkout.${id}` : `rb.idem.payment.${id}`;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
