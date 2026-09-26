// app/api/feedback/route.ts
// Guest Feedback API endpoint (Contract Request C5)
// Stores post-stay or post-order feedback and ratings

import { NextResponse } from 'next/server';
import { extractStayToken, verifyStayToken } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const FeedbackInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  comment: z.string().max(1000).optional(),
  invoice_id: z.string().optional(),
  order_id: z.string().optional(),
  stayToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = extractStayToken(request) || body.stayToken;

    if (!token) {
      return NextResponse.json({ error: 'Stay token is required' }, { status: 401 });
    }

    const session = verifyStayToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired stay token' }, { status: 401 });
    }

    const validated = FeedbackInputSchema.parse(body);

    const feedback = db.submitFeedback({
      hotelId: session.hotelId,
      stayId: session.stayId,
      guestName: session.guestName,
      roomNumber: session.roomNumber,
      rating: validated.rating,
      tags: validated.tags,
      comment: validated.comment,
      invoiceId: validated.invoice_id,
      orderId: validated.order_id,
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error: any) {
    const message = error.message || 'Failed to submit feedback';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
