'use client';

// lib/guest/data/live.ts
// Keeps order/request/invoice data current after the initial fetch (docs/m2/05 §6):
//   - mock source: the simulator's own event ticks (api.subscribe) drive an SWR mutate().
//   - api source + NEXT_PUBLIC_GUEST_REALTIME=supabase: a lazily-imported Realtime channel on
//     `stay:{stayId}` drives the mutate() instead.
//   - api source otherwise: polling — 4s while a non-terminal order or request exists and the
//     tab is visible, 20s once everything is terminal, paused while hidden.

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { unstable_serialize, useSWRConfig } from 'swr';
import { getGuestApi } from './index';
import { invoiceKey, ordersKey, requestsKey } from './hooks';
import type { GuestSession, Order, ServiceRequest } from '../types';

export type LiveState = 'live' | 'polling' | 'reconnecting' | 'offline';

const LiveContext = createContext<LiveState>('polling');

export function useLiveState(): LiveState {
  return useContext(LiveContext);
}

const ACTIVE_POLL_MS = 4000;
const IDLE_POLL_MS = 20000;
const RECONNECT_BACKOFF_MS = [4000, 8000, 16000, 30000];

function hasNonTerminalOrder(orders: Order[] | undefined): boolean {
  return !!orders?.some((o) => o.status !== 'delivered' && o.status !== 'cancelled');
}

function hasNonTerminalRequest(requests: ServiceRequest[] | undefined): boolean {
  return !!requests?.some((r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'rejected');
}

export function LiveProvider({ session, children }: { session: GuestSession | null; children: ReactNode }) {
  const { cache, mutate } = useSWRConfig();
  const [state, setState] = useState<LiveState>(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'polling'
  );

  useEffect(() => {
    if (!session) return;
    const activeSession = session;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempt = 0;

    const stayId = activeSession.stayId;

    function refetch() {
      mutate(ordersKey(stayId));
      mutate(requestsKey(stayId));
      mutate(invoiceKey(stayId));
    }

    function scheduleNextPoll() {
      if (cancelled) return;
      const orders = cache.get(unstable_serialize(ordersKey(stayId)))?.data as Order[] | undefined;
      const requests = cache.get(unstable_serialize(requestsKey(stayId)))?.data as ServiceRequest[] | undefined;
      const active = hasNonTerminalOrder(orders) || hasNonTerminalRequest(requests);
      const delay = active ? ACTIVE_POLL_MS : IDLE_POLL_MS;
      pollTimer = setTimeout(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') refetch();
        scheduleNextPoll();
      }, delay);
    }

    async function connectRealtime(): Promise<boolean> {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const client = createClient(url, anonKey);
        const channel = client
          .channel(`stay:${stayId}`)
          .on('broadcast', { event: 'status' }, () => refetch())
          .subscribe((status) => {
            if (cancelled) return;
            if (status === 'SUBSCRIBED') {
              reconnectAttempt = 0;
              setState('live');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setState('reconnecting');
              const delay = RECONNECT_BACKOFF_MS[Math.min(reconnectAttempt, RECONNECT_BACKOFF_MS.length - 1)];
              reconnectAttempt++;
              setTimeout(() => {
                if (!cancelled) refetch();
              }, delay);
            }
          });
        unsubscribe = () => {
          client.removeChannel(channel);
        };
        return true;
      } catch {
        return false;
      }
    }

    async function start() {
      const api = await getGuestApi();
      if (cancelled) return;

      if (api.source === 'mock') {
        setState('live');
        unsubscribe = api.subscribe(activeSession, () => refetch());
        return;
      }

      const wantsRealtime =
        process.env.NEXT_PUBLIC_GUEST_REALTIME === 'supabase' &&
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (wantsRealtime && (await connectRealtime())) return;

      setState('polling');
      scheduleNextPoll();
    }

    start();

    function onOnline() {
      setState((s) => (s === 'offline' ? 'polling' : s));
      refetch();
    }
    function onOffline() {
      setState('offline');
    }
    function onVisible() {
      if (document.visibilityState === 'visible') refetch();
    }

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (pollTimer) clearTimeout(pollTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session, cache, mutate]);

  return createElement(LiveContext.Provider, { value: state }, children);
}
