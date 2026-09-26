// modules/orders/service.ts
// Order placement business logic with server-authoritative pricing and state enforcement

import { verifyStayToken } from '@/server/auth';
import { db, Order } from '@/server/db';
import { PlaceOrderInput, TransitionOrderInput } from './schema';

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const session = verifyStayToken(input.stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired guest stay token.');
  }

  // The client never sends hotel_id, prices, or room_id. All derived securely on server!
  return db.createOrder({
    hotelId: session.hotelId,
    stayId: session.stayId,
    items: input.items,
    specialInstructions: input.specialInstructions,
    idempotencyKey: input.idempotencyKey,
  });
}

export async function transitionOrderStatus(
  input: TransitionOrderInput,
  hotelId: string,
  actorRole: string
): Promise<Order> {
  return db.transitionOrder(input.orderId, input.nextStatus, hotelId, actorRole);
}
