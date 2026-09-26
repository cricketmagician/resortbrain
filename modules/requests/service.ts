// modules/requests/service.ts
// Service request mutations and assignment

import { verifyStayToken } from '@/server/auth';
import { db, ServiceRequest } from '@/server/db';
import { CreateRequestInput, TransitionRequestInput } from './schema';

export async function createServiceRequest(input: CreateRequestInput): Promise<ServiceRequest> {
  const session = verifyStayToken(input.stayToken);
  if (!session) {
    throw new Error('Unauthorized: Invalid or expired guest stay token.');
  }

  return db.createRequest({
    hotelId: session.hotelId,
    stayId: session.stayId,
    category: input.category,
    title: input.title,
    details: input.details,
    priority: input.priority,
    slaMinutes: input.slaMinutes,
  });
}

export async function transitionRequestStatus(
  input: TransitionRequestInput,
  hotelId: string
): Promise<ServiceRequest> {
  return db.transitionRequest(input.requestId, input.nextStatus, hotelId, input.actorId, input.actorName);
}
