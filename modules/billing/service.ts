// modules/billing/service.ts
// Billing engine: invoice generation, idempotent test payment processing, and audit logs

import { verifyStayToken } from '@/server/auth';
import { db, Invoice } from '@/server/db';
import { ProcessPaymentInput } from './schema';

export async function processPayment(input: ProcessPaymentInput): Promise<Invoice> {
  const session = verifyStayToken(input.stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired guest stay token.');
  }

  return db.recordPayment({
    invoiceId: input.invoiceId,
    hotelId: session.hotelId,
    amountPaise: input.amountPaise,
    idempotencyKey: input.idempotencyKey,
  });
}

export async function getStayInvoice(stayToken: string): Promise<Invoice> {
  const session = verifyStayToken(stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid stay token.');
  }

  return db.getOrCreateStayInvoice(session.stayId, session.hotelId);
}
