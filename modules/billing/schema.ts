// modules/billing/schema.ts
// Zod schemas for invoices, payment settlement, and webhooks

import { z } from 'zod';

export const ProcessPaymentInputSchema = z.object({
  invoiceId: z.string().min(1),
  stayToken: z.string().min(1),
  amountPaise: z.number().int().positive(),
  paymentMethod: z.enum(['card_test', 'upi_test', 'room_charge']).default('card_test'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required for payment safety'),
});

export const WebhookPayloadSchema = z.object({
  eventId: z.string(),
  eventType: z.enum(['payment.succeeded', 'payment.failed', 'refund.created']),
  invoiceId: z.string(),
  hotelId: z.string(),
  amountPaise: z.number().int(),
  signature: z.string(),
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
