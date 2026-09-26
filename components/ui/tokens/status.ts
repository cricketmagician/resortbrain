// components/ui/tokens/status.ts
// Shared status wording and tones — the single source of truth for both the guest (M2) and
// staff (M3) halves, so the two sides never disagree on what a status is called.

export type StatusTone = 'progress' | 'success' | 'danger';

export interface StatusWording {
  guest: string;
  guestHint: string;
  staff: string;
  tone: StatusTone;
}

export const ORDER_STATUS = {
  pending:   { guest: 'Order placed',   guestHint: 'Sent to the kitchen',              staff: 'New',              tone: 'progress' },
  accepted:  { guest: 'Accepted',       guestHint: 'The kitchen has your order',       staff: 'Accepted',         tone: 'progress' },
  preparing: { guest: 'Being prepared', guestHint: 'Freshly made for you',             staff: 'Preparing',        tone: 'progress' },
  ready:     { guest: 'Ready',          guestHint: 'A runner is bringing it to you',   staff: 'Ready for pickup', tone: 'progress' },
  delivered: { guest: 'Delivered',      guestHint: 'Enjoy your meal',                  staff: 'Delivered',        tone: 'success'  },
  cancelled: { guest: 'Cancelled',      guestHint: 'Questions? The front desk can help.', staff: 'Cancelled',     tone: 'danger'   },
} as const satisfies Record<string, StatusWording>;

export const REQUEST_STATUS = {
  created:      { guest: 'Request sent', guestHint: 'Waiting for the team to pick it up', staff: 'New',         tone: 'progress' },
  acknowledged: { guest: 'On it',        guestHint: 'Someone has your request',           staff: 'Accepted',    tone: 'progress' },
  in_progress:  { guest: 'In progress',  guestHint: 'On the way to your room',            staff: 'In progress', tone: 'progress' },
  completed:    { guest: 'Done',         guestHint: "Anything else? We're here.",         staff: 'Completed',   tone: 'success'  },
  cancelled:    { guest: 'Cancelled',    guestHint: 'Questions? The front desk can help.', staff: 'Cancelled',  tone: 'danger'   },
  rejected:     { guest: "Couldn't be completed", guestHint: 'The front desk will follow up', staff: 'Rejected', tone: 'danger' },
} as const satisfies Record<string, StatusWording>;

export type OrderStatusKey = keyof typeof ORDER_STATUS;
export type RequestStatusKey = keyof typeof REQUEST_STATUS;
