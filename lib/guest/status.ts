// lib/guest/status.ts
// Builds the guest-facing timeline from the shared status tokens. Timestamps are attached only
// where the server actually has them — the client never invents one.

import { ORDER_STATUS, REQUEST_STATUS, type OrderStatusKey, type RequestStatusKey } from '@/components/ui/tokens/status';
import type { Order, OrderStatus, ServiceRequest, RequestStatus } from './types';

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'terminal-danger';

export interface TimelineStep {
  key: string;
  label: string;
  hint: string;
  time?: string;
  state: TimelineStepState;
}

const ORDER_HAPPY_PATH: OrderStatusKey[] = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];
const REQUEST_HAPPY_PATH: RequestStatusKey[] = ['created', 'acknowledged', 'in_progress', 'completed'];

/** Index in the happy path, or -1 for a terminal/cancelled status. Lets the UI ignore
 *  out-of-order (older) updates by comparing indexes. */
export function orderStepIndex(status: OrderStatus): number {
  return ORDER_HAPPY_PATH.indexOf(status as OrderStatusKey);
}

export function requestStepIndex(status: RequestStatus): number {
  return REQUEST_HAPPY_PATH.indexOf(status as RequestStatusKey);
}

export function buildOrderTimeline(order: Pick<Order, 'status' | 'createdAt' | 'updatedAt'>): TimelineStep[] {
  if (order.status === 'cancelled') {
    const wording = ORDER_STATUS.cancelled;
    return [{ key: 'cancelled', label: wording.guest, hint: wording.guestHint, time: order.updatedAt, state: 'terminal-danger' }];
  }
  const currentIndex = orderStepIndex(order.status);
  return ORDER_HAPPY_PATH.map((key, i) => {
    const wording = ORDER_STATUS[key];
    const time = i === 0 ? order.createdAt : i === currentIndex ? order.updatedAt : undefined;
    const state: TimelineStepState = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
    return { key, label: wording.guest, hint: wording.guestHint, time, state };
  });
}

export function buildRequestTimeline(
  request: Pick<ServiceRequest, 'status' | 'createdAt' | 'acknowledgedAt' | 'completedAt'>
): TimelineStep[] {
  if (request.status === 'cancelled' || request.status === 'rejected') {
    const wording = REQUEST_STATUS[request.status];
    return [{ key: request.status, label: wording.guest, hint: wording.guestHint, time: request.completedAt ?? request.acknowledgedAt, state: 'terminal-danger' }];
  }
  const currentIndex = requestStepIndex(request.status);
  return REQUEST_HAPPY_PATH.map((key, i) => {
    const wording = REQUEST_STATUS[key];
    let time: string | undefined;
    if (key === 'created') time = request.createdAt;
    else if (key === 'acknowledged') time = request.acknowledgedAt;
    else if (key === 'completed') time = request.completedAt;
    const state: TimelineStepState = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
    return { key, label: wording.guest, hint: wording.guestHint, time, state };
  });
}
