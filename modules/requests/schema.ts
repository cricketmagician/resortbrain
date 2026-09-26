// modules/requests/schema.ts
// Zod schemas for service requests, room assistance, and SLA tracking

import { z } from 'zod';

export const CreateRequestInputSchema = z.object({
  stayToken: z.string().min(1, 'Stay token is required'),
  category: z.enum(['housekeeping', 'amenities', 'front_desk', 'maintenance']),
  title: z.string().min(3).max(255),
  details: z.string().max(1000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  slaMinutes: z.number().int().positive().default(15),
});

export const TransitionRequestInputSchema = z.object({
  requestId: z.string().min(1),
  nextStatus: z.enum(['created', 'acknowledged', 'in_progress', 'completed', 'cancelled', 'rejected']),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof CreateRequestInputSchema>;
export type TransitionRequestInput = z.infer<typeof TransitionRequestInputSchema>;
