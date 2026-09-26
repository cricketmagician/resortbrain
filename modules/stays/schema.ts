// modules/stays/schema.ts
// Zod schemas for room stays, QR token verification, and check-in/out

import { z } from 'zod';

export const VerifyQRInputSchema = z.object({
  qrToken: z.string().min(1, 'QR Code token is required'),
});

export const StayTokenSessionSchema = z.object({
  stayId: z.string(),
  hotelId: z.string(),
  hotelSlug: z.string().optional(),
  hotelName: z.string(),
  roomId: z.string(),
  roomNumber: z.string(),
  guestName: z.string(),
  stayToken: z.string(),
  currency: z.string(),
  taxRate: z.number(),
  serviceCharge: z.number(),
});

export type VerifyQRInput = z.infer<typeof VerifyQRInputSchema>;
export type StayTokenSession = z.infer<typeof StayTokenSessionSchema>;
