'use client';

// lib/guest/cart.ts
// The guest cart: ids, quantities and kitchen notes only — never a price. Names and unit prices
// always come from the SSR menu that the caller already has, so a server-side price change
// shows up the moment the guest reloads. Persisted per stay so switching rooms never leaks a cart.

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { CartLine } from './types';

const EMPTY_LINES: CartLine[] = [];

function cartKey(stayId: string): string {
  return `rb.cart.${stayId}`;
}

const cache = new Map<string, { raw: string | null; lines: CartLine[] }>();

function readCart(stayId: string): CartLine[] {
  if (typeof localStorage === 'undefined') return EMPTY_LINES;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(cartKey(stayId));
  } catch {
    raw = null;
  }
  const cached = cache.get(stayId);
  if (cached && cached.raw === raw) return cached.lines;
  let lines: CartLine[] = EMPTY_LINES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) lines = parsed;
    } catch {
      lines = EMPTY_LINES;
    }
  }
  cache.set(stayId, { raw, lines });
  return lines;
}

function writeCart(stayId: string, lines: CartLine[]): void {
  const raw = JSON.stringify(lines);
  try {
    localStorage.setItem(cartKey(stayId), raw);
  } catch {
    // ignore — the in-memory cache below still lets this tab keep working this session
  }
  cache.set(stayId, { raw, lines });
  emit(stayId);
}

const listenersByStay = new Map<string, Set<() => void>>();

function emit(stayId: string): void {
  listenersByStay.get(stayId)?.forEach((listener) => listener());
}

export function addLine(stayId: string, menuItemId: string): void {
  const lines = readCart(stayId);
  const existing = lines.find((l) => l.menuItemId === menuItemId);
  const next = existing
    ? lines.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + 1 } : l))
    : [...lines, { menuItemId, quantity: 1 }];
  writeCart(stayId, next);
}

export function setQuantity(stayId: string, menuItemId: string, quantity: number): void {
  const lines = readCart(stayId);
  let next: CartLine[];
  if (quantity <= 0) {
    next = lines.filter((l) => l.menuItemId !== menuItemId);
  } else if (lines.some((l) => l.menuItemId === menuItemId)) {
    next = lines.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity } : l));
  } else {
    next = [...lines, { menuItemId, quantity }];
  }
  writeCart(stayId, next);
}

export function setNote(stayId: string, menuItemId: string, note: string): void {
  const lines = readCart(stayId);
  const trimmed = note.trim();
  const next = lines.map((l) => (l.menuItemId === menuItemId ? { ...l, note: trimmed || undefined } : l));
  writeCart(stayId, next);
}

export function clearCart(stayId: string): void {
  try {
    localStorage.removeItem(cartKey(stayId));
  } catch {
    // ignore
  }
  cache.set(stayId, { raw: null, lines: EMPTY_LINES });
  emit(stayId);
}

/** A stable string for a cart's contents, used to decide whether an idempotency key can be reused. */
export function cartHash(lines: CartLine[]): string {
  return lines
    .slice()
    .sort((a, b) => a.menuItemId.localeCompare(b.menuItemId))
    .map((l) => `${l.menuItemId}:${l.quantity}:${l.note ?? ''}`)
    .join('|');
}

function subscribeFactory(stayId: string) {
  return function subscribe(callback: () => void): () => void {
    let set = listenersByStay.get(stayId);
    if (!set) {
      set = new Set();
      listenersByStay.set(stayId, set);
    }
    set.add(callback);

    function onStorage(event: StorageEvent) {
      if (event.key === cartKey(stayId)) callback();
    }
    window.addEventListener('storage', onStorage);

    return () => {
      set?.delete(callback);
      window.removeEventListener('storage', onStorage);
    };
  };
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_LINES;
}

export interface UseCartResult {
  lines: CartLine[];
  add: (menuItemId: string) => void;
  setQty: (menuItemId: string, quantity: number) => void;
  setItemNote: (menuItemId: string, note: string) => void;
  clear: () => void;
}

export function useCart(stayId: string | null): UseCartResult {
  const subscribe = useMemo(() => (stayId ? subscribeFactory(stayId) : () => () => {}), [stayId]);
  const getSnapshot = useCallback(() => (stayId ? readCart(stayId) : EMPTY_LINES), [stayId]);
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    lines,
    add: useCallback((menuItemId: string) => stayId && addLine(stayId, menuItemId), [stayId]),
    setQty: useCallback((menuItemId: string, quantity: number) => stayId && setQuantity(stayId, menuItemId, quantity), [stayId]),
    setItemNote: useCallback((menuItemId: string, note: string) => stayId && setNote(stayId, menuItemId, note), [stayId]),
    clear: useCallback(() => stayId && clearCart(stayId), [stayId]),
  };
}
