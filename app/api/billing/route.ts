// app/api/billing/route.ts
// Folio invoice retrieval and idempotent test payment settlement

import { NextRequest, NextResponse } from 'next/server';
import { ProcessPaymentInputSchema } from '@/modules/billing/schema';
import { getStayInvoice, processPayment } from '@/modules/billing/service';
import { extractStayToken, verifyStayToken } from '@/server/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = extractStayToken(req, searchParams);

  if (!stayToken) {
    return NextResponse.json({ error: 'Missing stayToken parameter.' }, { status: 400 });
  }

  const session = verifyStayToken(stayToken);
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
  }

  try {
    const invoice = await getStayInvoice(stayToken);
    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve invoice';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const token = extractStayToken(req) || rawBody.stayToken;

    if (!token) {
      return NextResponse.json({ error: 'Stay token is required' }, { status: 401 });
    }

    const session = verifyStayToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
    }

    const validated = ProcessPaymentInputSchema.parse({
      ...rawBody,
      stayToken: token,
    });

    const invoice = await processPayment(validated);
    return NextResponse.json({ success: true, invoice }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment settlement failed';
    const status = message.includes('Unauthorized') || message.includes('stay token') ? 401 :
                   message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
