// app/api/notifications/route.ts
// Device registration for Web Push and manual test triggers

import { NextRequest, NextResponse } from 'next/server';
import { registerPushDevice, sendWebPushNotification } from '@/server/push';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'register') {
      const sub = registerPushDevice({
        hotel_id: body.hotelId || 'hotel-001',
        department: body.department || 'kitchen',
        deviceName: body.deviceName || 'Staff Tablet',
        subscription: body.subscription,
      });
      return NextResponse.json({ success: true, subscription: sub });
    }

    if (body.action === 'test_dispatch') {
      const result = await sendWebPushNotification({
        hotel_id: body.hotelId || 'hotel-001',
        department: body.department,
        title: body.title || 'ResortBrain Alert',
        body: body.body || 'New task requires attention',
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push action failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
