'use client';

// lib/guest/session.ts
// The one active guest session per device. Stored in localStorage only — never in a URL, a log
// line or an analytics event. The latest QR scan always wins.

import { useSyncExternalStore } from 'react';
import type { GuestSession } from './types';

const SESSION_KEY = 'rb.session.v1';
const LAST_HOTEL_KEY = 'rb.lastHotel';

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

let cache: { raw: string | null; value: GuestSession | null } = { raw: null, value: null };

export function getSession(): GuestSession | null {
  if (typeof localStorage === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SESSION_KEY);
  } catch {
    raw = null;
  }
  if (cache.raw === raw) return cache.value;
  let value: GuestSession | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as GuestSession;
    } catch {
      value = null;
    }
  }
  cache = { raw, value };
  return value;
}

export function saveSession(session: GuestSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(LAST_HOTEL_KEY, session.hotelSlug);
  } catch {
    // Storage can be unavailable (private browsing, quota). The session then only lives for
    // this page load, which is an acceptable degradation rather than a hard failure.
  }
  emitChange();
}

/** Refreshes validatedAt after a background resumeSession() succeeds, without a full re-save. */
export function touchSessionValidated(): void {
  const current = getSession();
  if (!current) return;
  saveSession({ ...current, validatedAt: new Date().toISOString() });
}

export function clearSession(): void {
  const current = getSession();
  try {
    localStorage.removeItem(SESSION_KEY);
    if (current) {
      localStorage.removeItem(`rb.cart.${current.stayId}`);
      sessionStorage.removeItem(`rb.idem.checkout.${current.stayId}`);
    }
  } catch {
    // ignore
  }
  emitChange();
}

export function getLastHotelSlug(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_HOTEL_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  function onStorage(event: StorageEvent) {
    if (event.key === SESSION_KEY) callback();
  }
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getServerSnapshot(): GuestSession | null {
  return null;
}

/** Returns the active session, or null if there isn't one, or if it belongs to a different hotel. */
export function useGuestSession(hotelId?: string): GuestSession | null {
  const session = useSyncExternalStore(subscribe, getSession, getServerSnapshot);
  if (!session) return null;
  if (hotelId && session.hotelId !== hotelId) return null;
  return session;
}
