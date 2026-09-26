// app/api/stays/verify/route.ts
// Resolves QR code or stay token into guest session

import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromQR, resolveSessionFromToken } from '@/modules/stays/service';
import { checkRateLimit } from '@/server/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`stay_verify_${ip}`, 60, 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please retry in a few moments.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { qrToken, stayToken } = body;

    let session = null;
    if (qrToken) {
      session = await resolveSessionFromQR(qrToken);
    } else if (stayToken) {
      session = await resolveSessionFromToken(stayToken);
    }

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired room QR code / stay token.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
