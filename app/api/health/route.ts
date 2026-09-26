// app/api/health/route.ts
// System health endpoint checking database, multi-tenancy, and push readiness

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getOutboxQueue } from '@/server/outbox';

export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    tenancy: {
      hotelsCount: db.hotels.length,
      activeHotels: db.hotels.filter((h) => h.status === 'active').map((h) => h.slug),
    },
    queues: {
      activeOrders: db.orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
      activeRequests: db.requests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length,
      outboxDepth: getOutboxQueue().length,
    },
    pushReadiness: {
      vapidConfigured: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    },
  };

  return NextResponse.json(health, { status: 200 });
}
