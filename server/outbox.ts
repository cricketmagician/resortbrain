// server/outbox.ts
// Transactional outbox worker and SLA auto-escalation engine

import { logAuditEvent } from './audit';

export interface OutboxMessage {
  id: string;
  hotel_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'delivered' | 'failed';
  attempts: number;
  created_at: string;
}

const outboxQueue: OutboxMessage[] = [];
type ListenerCallback = (event: OutboxMessage) => void;
const listeners: ListenerCallback[] = [];

export function subscribeToOutbox(callback: ListenerCallback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function enqueueOutboxEvent(
  hotel_id: string,
  event_type: string,
  payload: Record<string, unknown>
): Promise<OutboxMessage> {
  const message: OutboxMessage = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    hotel_id,
    event_type,
    payload,
    status: 'queued',
    attempts: 0,
    created_at: new Date().toISOString(),
  };

  outboxQueue.push(message);

  // Dispatch immediately for low latency (under 500ms p95 requirement)
  setTimeout(() => {
    processOutboxMessage(message);
  }, 10);

  return message;
}

function processOutboxMessage(message: OutboxMessage) {
  try {
    message.attempts += 1;
    // Broadcast to listeners (e.g. WebSocket / Realtime clients / Push sender)
    listeners.forEach((fn) => {
      try {
        fn(message);
      } catch (err) {
        console.error('Error in outbox listener:', err);
      }
    });

    message.status = 'delivered';
  } catch (err) {
    message.status = 'failed';
    console.error('Failed to dispatch outbox event:', err);
  }
}

export function getOutboxQueue(hotel_id?: string): OutboxMessage[] {
  if (hotel_id) {
    return outboxQueue.filter((m) => m.hotel_id === hotel_id);
  }
  return outboxQueue;
}

/**
 * Check SLA Escalation for unacknowledged requests
 */
export function checkSLAEscalations(requests: Array<{
  id: string;
  hotel_id: string;
  title: string;
  status: string;
  created_at: string;
  sla_minutes: number;
  escalation_sent?: boolean;
}>) {
  const now = Date.now();
  const escalated: string[] = [];

  for (const req of requests) {
    if (req.status === 'created' && !req.escalation_sent) {
      const elapsedMinutes = (now - new Date(req.created_at).getTime()) / (1000 * 60);
      if (elapsedMinutes >= req.sla_minutes) {
        req.escalation_sent = true;
        escalated.push(req.id);

        enqueueOutboxEvent(req.hotel_id, 'notification.escalated', {
          requestId: req.id,
          title: req.title,
          elapsedMinutes: Math.round(elapsedMinutes),
          slaThreshold: req.sla_minutes,
          reason: `Breached ${req.sla_minutes} min SLA without staff acknowledgment`,
        });

        logAuditEvent({
          hotel_id: req.hotel_id,
          actor_role: 'system_scheduler',
          action: 'REQUEST_SLA_ESCALATED',
          target_resource: `service_request:${req.id}`,
          details: { sla_minutes: req.sla_minutes, elapsedMinutes },
        });
      }
    }
  }

  return escalated;
}
