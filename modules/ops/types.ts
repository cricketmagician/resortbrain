export type UserRole =
  | "sous_chef"
  | "line_cook"
  | "front_desk"
  | "housekeeping"
  | "maintenance"
  | "manager"
  | "super_admin";

export type Department = "kitchen" | "desk" | "housekeeping" | "admin";

export interface HotelTenant {
  id: string;
  name: string;
  code: string;
  plan: "Enterprise" | "Boutique" | "Standard" | "Trial";
  rooms: number;
  activeStays: number;
  status: "ACTIVE" | "SUSPENDED";
  currency: string;
  mrrPaise: number;
}

export interface StaffMember {
  id: string;
  hotelId: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: Department;
  station: string;
  shift: string;
  pin: string;
}

export interface OrderItemModifier {
  name: string;
  quantity: number;
  modifiers?: string[];
  allergens?: string[];
  notes?: string;
}

export type TicketStatus = "pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled";

export interface KitchenTicket {
  id: string;
  hotelId: string;
  ticketNumber: string;
  roomNumber: string;
  stayId: string;
  guestName: string;
  placedAt: string; // ISO UTC
  dueAt: string;    // ISO UTC
  status: TicketStatus;
  items: OrderItemModifier[];
  note?: string;
  priority?: boolean;
  vip?: boolean;
  acceptedBy?: string;
  acceptedAt?: string;
}

export type RoomCleanStatus = "CLEAN" | "DIRTY" | "CLEANING" | "INSPECTED" | "OOO";
export type RoomOccupancyStatus = "VAC" | "OCC" | "DEP" | "MAINT";

export interface RoomRecord {
  id: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  type: string;
  cleanStatus: RoomCleanStatus;
  occupancyStatus: RoomOccupancyStatus;
  attendant?: string;
  notes?: string;
  lastUpdated: string;
}

export interface ServiceRequest {
  id: string;
  hotelId: string;
  roomNumber: string;
  title: string;
  category: "Pillows" | "Crib" | "Towels" | "Cleaning" | "Maintenance" | "Luggage";
  placedAt: string;
  dueAt: string;
  status: "created" | "acknowledged" | "in_progress" | "completed";
  assignedTo?: string;
  urgency: "normal" | "urgent" | "critical";
}

export interface FolioItem {
  id: string;
  description: string;
  timestamp: string;
  amountPaise: number; // Positive = charge, negative = credit/discount
  source: "System Auto" | "Kitchen Pos" | "Spa Desk" | "Desk (Adj)" | "MiniBar";
  isLocked: boolean;
  auditNote?: string;
  authorizedBy?: string;
}

export interface StayFolio {
  id: string;
  hotelId: string;
  roomNumber: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  stayToken: string;
  status: "Checked In" | "Active Due" | "Check-Out" | "Clean Ready";
  isVip: boolean;
  items: FolioItem[];
  // Strictly rendered, derived from server
  totalNetPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalDuePaise: number;
}

export interface DeviceConfig {
  id: string;
  hotelId: string;
  deviceName: string;
  assignedDept: Department;
  assignedRole: string;
  mode: "shared" | "personal";
  status: "Active & Bound" | "Unregistered";
  endpointUuid: string;
  swVersion: string;
  lastPing: string;
  currentOperator: string;
  shiftEndsIn: string;
}

export interface SlaEscalationAlert {
  id: string;
  hotelId: string;
  roomNumber: string;
  title: string;
  department: Department;
  overdueMinutes: number;
  severity: "critical" | "warning";
  reason: string;
  escalatedTo: string;
  staffAssigned?: string;
}

export interface AuditLogItem {
  id: string;
  hotelId: string;
  timestamp: string; // ISO UTC
  actorId: string;
  actorName: string;
  eventType:
    | "order.created"
    | "order.accepted"
    | "order.prepared"
    | "folio.manual_discount"
    | "folio.manual_charge"
    | "folio.settled"
    | "audit.support_access"
    | "notification.escalated"
    | "tenant.suspended";
  entityTarget: string;
  ipAddress: string;
  traceId: string;
  payload: Record<string, unknown>;
}

export interface MenuItem {
  id: string;
  hotelId: string;
  title: string;
  category: "Starters" | "Mains" | "Desserts" | "Beverages" | "Late Night";
  pricePaise: number;
  taxRatePct: number;
  isAvailable: boolean;
  description: string;
  allergens: string[];
  station: string;
  slaTargetMinutes: number;
}
