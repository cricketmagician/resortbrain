// modules/orders/queries.ts
// Order read models for Kitchen display screen and guest timeline

import { verifyStayToken } from '@/server/auth';
import { db, Order } from '@/server/db';

export async function getGuestOrders(stayToken: string): Promise<Order[]> {
  const session = verifyStayToken(stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired guest stay token.');
  }

  return db.getOrders(session.hotelId, session.stayId);
}

export async function getKitchenQueue(hotelId: string): Promise<Order[]> {
  const allOrders = db.getOrders(hotelId);
  // Kitchen sees pending, accepted, preparing, and ready orders
  return allOrders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
}

export async function getDeliveredOrders(hotelId: string): Promise<Order[]> {
  const allOrders = db.getOrders(hotelId);
  return allOrders.filter((o) => o.status === 'delivered');
}
