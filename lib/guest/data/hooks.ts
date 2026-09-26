'use client';

// lib/guest/data/hooks.ts
// SWR hooks over the active GuestApi (docs/m2/05 §6). Polling/realtime cadence lives in
// live.ts's LiveProvider, which calls `mutate()` on these same keys — these hooks just fetch.

import useSWR, { type SWRConfiguration } from 'swr';
import { getGuestApi } from './index';
import type { GuestSession, Invoice, Order, ServiceRequest } from '../types';

const SWR_OPTIONS: SWRConfiguration = {
  revalidateOnFocus: true,
  dedupingInterval: 2000,
  keepPreviousData: true,
  shouldRetryOnError: false,
};

export function ordersKey(stayId: string) {
  return ['orders', stayId] as const;
}
export function requestsKey(stayId: string) {
  return ['requests', stayId] as const;
}
export function invoiceKey(stayId: string) {
  return ['invoice', stayId] as const;
}

export function useOrders(session: GuestSession | null) {
  return useSWR<Order[]>(
    session ? ordersKey(session.stayId) : null,
    async () => {
      const api = await getGuestApi();
      return api.listOrders(session!);
    },
    SWR_OPTIONS
  );
}

export function useOrder(session: GuestSession | null, orderId: string | undefined) {
  const { data: orders, ...rest } = useOrders(session);
  return { ...rest, data: orderId ? orders?.find((o) => o.id === orderId) : undefined, orders };
}

export function useRequests(session: GuestSession | null) {
  return useSWR<ServiceRequest[]>(
    session ? requestsKey(session.stayId) : null,
    async () => {
      const api = await getGuestApi();
      return api.listRequests(session!);
    },
    SWR_OPTIONS
  );
}

export function useRequest(session: GuestSession | null, requestId: string | undefined) {
  const { data: requests, ...rest } = useRequests(session);
  return { ...rest, data: requestId ? requests?.find((r) => r.id === requestId) : undefined, requests };
}

export function useInvoice(session: GuestSession | null) {
  return useSWR<Invoice>(
    session ? invoiceKey(session.stayId) : null,
    async () => {
      const api = await getGuestApi();
      return api.getInvoice(session!);
    },
    SWR_OPTIONS
  );
}
