// lib/housekeeping-request-sync.ts
//
// Same bridge as lib/kitchen-order-sync.ts, for service requests: connects the staff
// housekeeping/front-desk views (lib/ops-store.tsx's serviceRequests, previously purely
// local/seeded) to the real requests guests actually submit (app/api/requests,
// server/db.ts). See kitchen-order-sync.ts for why only "Grand Azure Resort & Spa" maps
// to a real backend tenant — the same OPS_HOTEL_TO_BACKEND_SLUG allowlist applies here.

import type { ServiceRequest as OpsServiceRequest } from "@/modules/ops/types";

export interface BackendServiceRequest {
  id: string;
  hotel_id: string;
  room_number?: string;
  category: string;
  title: string;
  details?: string;
  status: "created" | "acknowledged" | "in_progress" | "completed" | "cancelled" | "rejected";
  priority: "low" | "normal" | "high" | "urgent";
  sla_minutes?: number;
  created_at: string;
}

// The ops UI only models 4 states (created/acknowledged/in_progress/completed) — cancelled
// and rejected requests are folded into "completed" (closed, nothing left to act on) since
// there's no separate UI treatment for them here.
const STATUS_MAP: Record<BackendServiceRequest["status"], OpsServiceRequest["status"]> = {
  created: "created",
  acknowledged: "acknowledged",
  in_progress: "in_progress",
  completed: "completed",
  cancelled: "completed",
  rejected: "completed",
};

const DEFAULT_SLA_MINUTES = 20;

export function mapRequestToOpsRequest(r: BackendServiceRequest, assignedTo?: string): OpsServiceRequest {
  const slaMinutes = r.sla_minutes || DEFAULT_SLA_MINUTES;
  const dueAt = new Date(new Date(r.created_at).getTime() + slaMinutes * 60 * 1000).toISOString();

  return {
    id: r.id,
    hotelId: r.hotel_id,
    roomNumber: r.room_number || "—",
    title: r.title,
    category: r.category,
    placedAt: r.created_at,
    dueAt,
    status: STATUS_MAP[r.status] ?? "created",
    assignedTo,
    urgency: r.priority === "urgent" || r.priority === "high" ? "urgent" : "normal",
  };
}
