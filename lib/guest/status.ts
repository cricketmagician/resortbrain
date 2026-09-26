// lib/guest/status.ts
// Builds the guest-facing timeline from the shared status tokens. Timestamps are attached only
// where the server actually has them — the client never invents one.

import { ORDER_STATUS, REQUEST_STATUS, type OrderStatusKey, type RequestStatusKey } from '@/components/ui/tokens/status';
import type { Order, OrderStatus, ServiceRequest, RequestStatus } from './types';

export interface TimelineStep {
  key: string;
  label: string;
  hint?: string;
  at?: string;
}

export interface TerminalStep {
  key: string;
  tone: 'danger' | 'neutral';
  label: string;
  hint?: string;
  at?: string;
}

export interface Timeline {
  steps: TimelineStep[];
  currentKey: string | null;
  terminal?: TerminalStep;
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

export function buildOrderTimeline(order: Pick<Order, 'status' | 'createdAt' | 'updatedAt'>): Timeline {
  const steps: TimelineStep[] = [{ key: 'pending', label: ORDER_STATUS.pending.guest, hint: ORDER_STATUS.pending.guestHint, at: order.createdAt }];

  if (order.status === 'cancelled') {
    return {
      steps,
      currentKey: null,
      terminal: { key: 'cancelled', tone: 'danger', label: ORDER_STATUS.cancelled.guest, hint: ORDER_STATUS.cancelled.guestHint, at: order.updatedAt },
    };
  }

  for (const key of ORDER_HAPPY_PATH.slice(1)) {
    const wording = ORDER_STATUS[key];
    const at = key === order.status ? order.updatedAt : undefined;
    steps.push({ key, label: wording.guest, hint: wording.guestHint, at });
  }
  return { steps, currentKey: order.status };
}

export function buildRequestTimeline(
  request: Pick<ServiceRequest, 'status' | 'createdAt' | 'acknowledgedAt' | 'completedAt'>
): Timeline {
  const steps: TimelineStep[] = [{ key: 'created', label: REQUEST_STATUS.created.guest, hint: REQUEST_STATUS.created.guestHint, at: request.createdAt }];

  if (request.status === 'cancelled' || request.status === 'rejected') {
    const wording = REQUEST_STATUS[request.status];
    return {
      steps,
      currentKey: null,
      terminal: { key: request.status, tone: 'danger', label: wording.guest, hint: wording.guestHint, at: request.completedAt ?? request.acknowledgedAt },
    };
  }

  for (const key of REQUEST_HAPPY_PATH.slice(1)) {
    const wording = REQUEST_STATUS[key];
    const at = key === 'acknowledged' ? request.acknowledgedAt : key === 'completed' ? request.completedAt : undefined;
    steps.push({ key, label: wording.guest, hint: wording.guestHint, at });
  }
  return { steps, currentKey: request.status };
}
