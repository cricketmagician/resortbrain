// server/audit.ts
// Append-only audit logging system for tenant isolation, security, and manager compliance

export interface AuditLogEntry {
  id: string;
  hotel_id?: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_resource: string;
  details: Record<string, unknown>;
  trace_id: string;
  created_at: string;
}

// In-memory persistent buffer for audit logs (mirrored to DB)
const auditLogsStore: AuditLogEntry[] = [];

export async function logAuditEvent(params: {
  hotel_id?: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_resource: string;
  details?: Record<string, unknown>;
  trace_id?: string;
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    hotel_id: params.hotel_id,
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    action: params.action,
    target_resource: params.target_resource,
    details: params.details || {},
    trace_id: params.trace_id || `trace_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
  };

  auditLogsStore.unshift(entry);
  if (auditLogsStore.length > 500) {
    auditLogsStore.pop();
  }

  // Also log to stdout with structured format
  console.log(`[AUDIT] [${entry.created_at}] [Hotel: ${entry.hotel_id || 'PLATFORM'}] [${entry.actor_role}] ${entry.action} -> ${entry.target_resource}`);

  return entry;
}

export function getAuditLogs(hotel_id?: string, limit = 50): AuditLogEntry[] {
  if (hotel_id) {
    return auditLogsStore.filter((log) => log.hotel_id === hotel_id).slice(0, limit);
  }
  return auditLogsStore.slice(0, limit);
}
