// lib/guest/data/mock.ts
// Adapts mock/guest/server-sim.ts to the GuestApi contract. The simulator owns the actual
// business logic (and is the one place allowed to compute money); this file just wires it up.

import * as sim from '@/mock/guest/server-sim';
import type { GuestApi } from './types';

export const mockApi: GuestApi = {
  source: 'mock',
  capabilities: { quote: true, feedback: true },

  resolveQr: sim.resolveQr,
  resumeSession: sim.resumeSession,
  quoteOrder: sim.quoteOrder,
  placeOrder: sim.placeOrder,
  listOrders: sim.listOrders,
  createRequest: sim.createRequest,
  listRequests: sim.listRequests,
  getInvoice: sim.getInvoice,
  pay: sim.pay,
  submitFeedback: sim.submitFeedback,

  subscribe(session, onEvent) {
    return sim.subscribeToStay(session.stayId, onEvent);
  },
};
