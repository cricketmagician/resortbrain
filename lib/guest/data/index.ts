'use client';

// lib/guest/data/index.ts
// getGuestApi() is the ONLY import guest UI code uses to talk to data. It picks the live adapter
// when M1's API is reachable and falls back to the mock adapter otherwise, so the UI never waits
// on the backend (docs/m2/05 §3).

import { useEffect, useState } from 'react';
import { httpApi } from './http';
import { mockApi } from './mock';
import type { GuestApi } from './types';

export type { GuestApi } from './types';
export { GuestApiError } from './types';
export type { GuestApiErrorKind } from './types';

const SESSION_STORAGE_KEY = 'rb.dataSource';
const PROBE_TIMEOUT_MS = 1500;

function readConfiguredSource(): 'api' | 'mock' | 'auto' {
  const raw = process.env.NEXT_PUBLIC_GUEST_DATA_SOURCE;
  return raw === 'api' || raw === 'mock' ? raw : 'auto';
}

async function probeSource(): Promise<'api' | 'mock'> {
  if (typeof window === 'undefined') return 'mock';

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === 'api' || stored === 'mock') return stored;
  } catch {
    // ignore
  }

  let source: 'api' | 'mock' = 'mock';
  try {
    const res = await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    source = res.status === 200 ? 'api' : 'mock';
  } catch {
    source = 'mock';
  }

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, source);
  } catch {
    // ignore
  }
  return source;
}

let cachedApiPromise: Promise<GuestApi> | null = null;

/** Memoised per page load — never resolves to mock data and then swaps to live data mid-session. */
export function getGuestApi(): Promise<GuestApi> {
  if (!cachedApiPromise) {
    const configured = readConfiguredSource();
    cachedApiPromise =
      configured === 'auto'
        ? probeSource().then((source) => (source === 'api' ? httpApi : mockApi))
        : Promise.resolve(configured === 'api' ? httpApi : mockApi);
  }
  return cachedApiPromise;
}

/** Resolves once the adapter is known, for UI that only needs to know the source (DemoDataBadge). */
export function useGuestApiSource(): 'api' | 'mock' | null {
  const [source, setSource] = useState<'api' | 'mock' | null>(null);

  useEffect(() => {
    let active = true;
    getGuestApi().then((api) => {
      if (active) setSource(api.source);
    });
    return () => {
      active = false;
    };
  }, []);

  return source;
}
