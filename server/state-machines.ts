// server/state-machines.ts
// Strict state transition enforcement for Stays, Rooms, Requests, Orders, and Invoices

export type StayStatus = 'reserved' | 'checked_in' | 'active' | 'checked_out' | 'cancelled' | 'no_show';
export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'inspected' | 'maintenance' | 'out_of_order';
export type RequestStatus = 'created' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'voided' | 'refunded';

const STAY_TRANSITIONS: Record<StayStatus, StayStatus[]> = {
  reserved: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['active', 'cancelled'],
  active: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

const ROOM_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  available: ['reserved', 'occupied', 'cleaning', 'maintenance'],
  reserved: ['occupied', 'available', 'cleaning'],
  occupied: ['cleaning', 'maintenance'],
  cleaning: ['inspected', 'available'],
  inspected: ['available', 'reserved', 'occupied'],
  maintenance: ['available', 'cleaning', 'out_of_order'],
  out_of_order: ['maintenance', 'cleaning'],
};

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  created: ['acknowledged', 'cancelled', 'rejected'],
  acknowledged: ['in_progress', 'cancelled', 'rejected'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['issued', 'voided'],
  issued: ['partially_paid', 'paid', 'voided'],
  partially_paid: ['paid', 'refunded'],
  paid: ['refunded'],
  voided: [],
  refunded: [],
};

export class StateTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(`Invalid ${entity} state transition from "${from}" to "${to}". Action rejected and logged.`);
    this.name = 'StateTransitionError';
  }
}

export function validateStayTransition(current: StayStatus, next: StayStatus): boolean {
  if (!STAY_TRANSITIONS[current]?.includes(next)) {
    throw new StateTransitionError('Stay', current, next);
  }
  return true;
}

export function validateRoomTransition(current: RoomStatus, next: RoomStatus): boolean {
  if (!ROOM_TRANSITIONS[current]?.includes(next)) {
    throw new StateTransitionError('Room', current, next);
  }
  return true;
}

export function validateRequestTransition(current: RequestStatus, next: RequestStatus): boolean {
  if (!REQUEST_TRANSITIONS[current]?.includes(next)) {
    throw new StateTransitionError('ServiceRequest', current, next);
  }
  return true;
}

export function validateOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (!ORDER_TRANSITIONS[current]?.includes(next)) {
    throw new StateTransitionError('Order', current, next);
  }
  return true;
}

export function validateInvoiceTransition(current: InvoiceStatus, next: InvoiceStatus): boolean {
  if (!INVOICE_TRANSITIONS[current]?.includes(next)) {
    throw new StateTransitionError('Invoice', current, next);
  }
  return true;
}
