// modules/requests/queries.ts
// Service request queries for staff queues and guest timelines

import { verifyStayToken } from '@/server/auth';
import { db, ServiceRequest } from '@/server/db';
import { checkSLAEscalations } from '@/server/outbox';

export async function getGuestRequests(stayToken: string): Promise<ServiceRequest[]> {
  const session = verifyStayToken(stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired stay token.');
  }

  return db.getRequests(session.hotelId, session.stayId);
}

export async function getDepartmentRequests(
  hotelId: string,
  category?: 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance'
): Promise<ServiceRequest[]> {
  const all = db.getRequests(hotelId);
  // Auto-check and trigger SLA escalations on unacknowledged requests
  checkSLAEscalations(all);

  if (category) {
    return all.filter((r) => r.category === category);
  }
  return all;
}
