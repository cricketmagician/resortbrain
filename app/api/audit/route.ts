// app/api/audit/route.ts
// Audit logs query endpoint for Platform Admin and Security Inspection

import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/server/audit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const logs = getAuditLogs(hotelId, limit);
  return NextResponse.json({ logs });
}
