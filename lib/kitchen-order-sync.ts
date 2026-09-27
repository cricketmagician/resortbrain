// lib/kitchen-order-sync.ts
//
// Bridges the staff Kitchen KDS (lib/ops-store.tsx, driven by KitchenTicket) to the real
// order pipeline guests actually place orders through (app/api/orders, server/db.ts's
// Order records). Before this, the KDS ran entirely on local seeded/simulated tickets with
// zero connection to guest activity — a guest's real order never appeared here.
//
// The staff console's hotel roster (db/seed/ops/seed-data.ts's SEED_HOTELS: h_901..h_904,
// used for the multi-tenant switcher and the platform/MRR demo screens) is a separate,
// unrelated seed dataset from the real backend tenants guests can order against
// (server/tenant.ts's KNOWN_TENANTS: hotel-001/grand-azure, hotel-002/the-heritage-palace,
// hotel-003/the-leela-palace). Only "Grand Azure Resort & Spa" has a real counterpart on
// both sides — the other three seeded hotels exist purely to populate the platform-admin
// demo screens (they were never real, checkoutable tenants), so their kitchen views
// correctly keep using local simulated data; only Grand Azure's KDS polls real orders.

import type { KitchenTicket, OrderItemModifier } from "@/modules/ops/types";

export const OPS_HOTEL_TO_BACKEND_SLUG: Record<string, string> = {
  h_901: "grand-azure",
};

export interface BackendOrderItem {
  itemName: string;
  quantity: number;
}

export interface BackendOrder {
  id: string;
  hotel_id: string;
  room_number?: string;
  order_number: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled";
  items: BackendOrderItem[];
  special_instructions?: string;
  created_at: string;
  updated_at?: string;
}

// The orders API doesn't carry a prep-time target per order (menu items do, via
// slaTargetMinutes, but that catalog isn't the same one guest orders reference) — 20
// minutes is a reasonable flat default until the backend exposes a real per-order SLA.
const DEFAULT_PREP_SLA_MINUTES = 20;

export function mapOrderToKitchenTicket(order: BackendOrder, acceptedBy?: string): KitchenTicket {
  const dueAt = new Date(new Date(order.created_at).getTime() + DEFAULT_PREP_SLA_MINUTES * 60 * 1000).toISOString();
  const items: OrderItemModifier[] = order.items.map((item) => ({
    name: item.itemName,
    quantity: item.quantity,
  }));

  return {
    id: order.id,
    hotelId: order.hotel_id,
    ticketNumber: order.order_number,
    roomNumber: order.room_number || "—",
    stayId: "",
    placedAt: order.created_at,
    dueAt,
    status: order.status,
    items,
    note: order.special_instructions,
    acceptedBy,
  };
}
