// app/api/billing/route.ts
// Folio invoice retrieval and idempotent test payment settlement

import { NextRequest, NextResponse } from 'next/server';
import { ProcessPaymentInputSchema } from '@/modules/billing/schema';
import { getStayInvoice, processPayment } from '@/modules/billing/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stayToken = searchParams.get('stayToken');

  if (!stayToken) {
    return NextResponse.json({ error: 'Missing stayToken parameter.' }, { status: 400 });
  }

  try {
    const invoice = await getStayInvoice(stayToken);
    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve invoice';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validated = ProcessPaymentInputSchema.parse(rawBody);

    const invoice = await processPayment(validated);
    return NextResponse.json({ success: true, invoice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment settlement failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
