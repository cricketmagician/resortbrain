// app/api/hotels/register/route.ts
// Onboard and register a new hotel tenant

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { z } from 'zod';

const RegisterHotelSchema = z.object({
  name: z.string().min(3, 'Hotel name is required'),
  slug: z.string().min(3, 'Unique slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  tagline: z.string().optional(),
  managerName: z.string().min(2, 'Manager name is required'),
  managerEmail: z.string().email('Valid email is required'),
  roomsCount: z.number().int().positive().max(500).default(12),
  currency: z.string().default('INR'),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const validated = RegisterHotelSchema.parse(raw);

    const result = db.registerHotel(validated);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
