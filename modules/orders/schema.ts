// modules/orders/schema.ts
// Zod contracts for order placement, state transitions, and server pricing

import { z } from 'zod';

export const OrderItemInputSchema = z.object({
  menuItemId: z.string().min(1, 'Menu Item ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const PlaceOrderInputSchema = z.object({
  stayToken: z.string().min(1, 'Stay token is required'),
  items: z.array(OrderItemInputSchema).min(1, 'Cart cannot be empty'),
  specialInstructions: z.string().max(500).optional(),
  idempotencyKey: z.string().optional(),
});

export const TransitionOrderInputSchema = z.object({
  orderId: z.string().min(1),
  nextStatus: z.enum(['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']),
  note: z.string().optional(),
});

export const QuoteOrderInputSchema = z.object({
  stayToken: z.string().optional(),
  hotelId: z.string().optional(),
  hotelSlug: z.string().optional(),
  items: z.array(OrderItemInputSchema).min(1, 'Cart cannot be empty'),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
export type TransitionOrderInput = z.infer<typeof TransitionOrderInputSchema>;
export type QuoteOrderInput = z.infer<typeof QuoteOrderInputSchema>;
