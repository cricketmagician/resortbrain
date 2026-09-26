// tests/rls/rls_isolation.test.ts
// Cross-tenant data isolation and leakage test suite (CI Gate)

import { describe, it, expect } from 'vitest';
import { db } from '@/server/db';
import { assertTenantAccess } from '@/server/auth';
import { getAuditLogs } from '@/server/audit';

describe('Multi-Tenant Row-Level Security & Isolation (RLS)', () => {
  const HOTEL_A = 'hotel-001'; // Grand Azure Resort
  const HOTEL_B = 'hotel-002'; // The Heritage Palace

  it('guarantees Hotel A orders query returns 0 rows belonging to Hotel B', () => {
    // Seed an order for Hotel B
    db.createOrder({
      hotelId: HOTEL_B,
      stayId: 'stay-002',
      items: [{ menuItemId: 'item-201', quantity: 1 }],
    });

    const hotelAOrders = db.getOrders(HOTEL_A);
    const leakedOrders = hotelAOrders.filter((order) => order.hotel_id === HOTEL_B);

    expect(leakedOrders.length).toBe(0);
  });

  it('guarantees Hotel A menu query returns 0 items belonging to Hotel B', () => {
    const hotelAMenu = db.getMenu(HOTEL_A);
    const leakedMenuItems = hotelAMenu.filter((item) => item.hotel_id === HOTEL_B);

    expect(leakedMenuItems.length).toBe(0);
  });

  it('blocks staff from Hotel A from updating an order in Hotel B and writes security audit log', () => {
    // Create an order in Hotel B
    const hotelBOrder = db.createOrder({
      hotelId: HOTEL_B,
      stayId: 'stay-002',
      items: [{ menuItemId: 'item-201', quantity: 1 }],
    });

    // Attempt mutation by Hotel A chef
    expect(() => {
      db.transitionOrder(hotelBOrder.id, 'accepted', HOTEL_A, 'kitchen_chef');
    }).toThrowError(/Tenant violation/);

    // Verify audit log captured the cross-tenant violation
    const recentLogs = getAuditLogs();
    const violationLog = recentLogs.find((l) => l.action === 'CROSS_TENANT_ORDER_MUTATION_DENIED');
    expect(violationLog).toBeDefined();
    expect(violationLog?.target_resource).toBe(`order:${hotelBOrder.id}`);
  });

  it('blocks cross-tenant resource access assertion and records security event', () => {
    expect(() => {
      assertTenantAccess(HOTEL_A, HOTEL_B, 'hotel_manager');
    }).toThrowError(/Cross-tenant isolation violation/);

    const logs = getAuditLogs();
    const breachAttempt = logs.find((l) => l.action === 'CROSS_TENANT_ACCESS_DENIED');
    expect(breachAttempt).toBeDefined();
  });
});
