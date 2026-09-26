// server/auth.ts
// Secure token derivation, role authorization, and tenant isolation

import crypto from 'node:crypto';
import { logAuditEvent } from './audit';
import { db } from './db';

export type UserRole =
  | 'platform_admin'
  | 'hotel_manager'
  | 'front_desk'
  | 'kitchen_chef'
  | 'housekeeping';

export interface StaffSession {
  userId: string;
  email: string;
  fullName: string;
  hotelId: string;
  role: UserRole;
}

export interface GuestSession {
  stayId: string;
  hotelId: string;
  hotelSlug?: string;
  roomId: string;
  roomNumber: string;
  guestId: string;
  guestName: string;
  token: string;
  expiresAt: string;
}

// Server-authoritative cryptographic secret
const SECRET_SALT = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STAY_TOKEN_SECRET || 'resortbrain_super_secure_vault_2026_conclave_edition';

function computeHmac(payload: string, secret: string = SECRET_SALT): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createStayToken(stay: {
  stayId: string;
  hotelId: string;
  hotelSlug?: string;
  roomId: string;
  roomNumber: string;
  guestId: string;
  guestName: string;
  expiresAt: string;
}, secret: string = SECRET_SALT): string {
  const payload = Buffer.from(JSON.stringify(stay)).toString('base64url');
  const signature = computeHmac(payload, secret);
  return `rb_${payload}.${signature}`;
}

export function verifyStayToken(token: string, secret: string = SECRET_SALT): GuestSession | null {
  try {
    if (!token) return null;

    // Handle seeded legacy/demo tokens cleanly
    if (!token.startsWith('rb_')) {
      const seeded = db.getStayByToken(token);
      if (seeded) {
        const hotel = db.getHotel(seeded.hotel_id);
        return {
          stayId: seeded.id,
          hotelId: seeded.hotel_id,
          hotelSlug: hotel?.slug,
          roomId: seeded.room_id,
          roomNumber: seeded.room_number,
          guestId: seeded.guest_id,
          guestName: seeded.guest_name,
          token,
          expiresAt: seeded.check_out,
        };
      }
      return null;
    }

    const raw = token.slice(3);
    const [payload, signature] = raw.split('.');
    if (!payload || !signature) return null;

    const expectedSig = computeHmac(payload, secret);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logAuditEvent({
        actor_role: 'unauthenticated_guest',
        action: 'TOKEN_TAMPER_DETECTED',
        target_resource: 'guest_auth',
        details: { tokenPreview: token.slice(0, 15) },
      });
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (new Date(decoded.expiresAt).getTime() < Date.now()) {
      logAuditEvent({
        hotel_id: decoded.hotelId,
        actor_role: 'expired_guest',
        action: 'EXPIRED_TOKEN_ATTEMPT',
        target_resource: 'guest_auth',
        details: { stayId: decoded.stayId },
      });
      return null;
    }

    return {
      stayId: decoded.stayId,
      hotelId: decoded.hotelId,
      hotelSlug: decoded.hotelSlug,
      roomId: decoded.roomId,
      roomNumber: decoded.roomNumber,
      guestId: decoded.guestId,
      guestName: decoded.guestName,
      token,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts stay token from Authorization header (Bearer), x-stay-token header, query string, or body
 */
export function extractStayToken(req: Request, searchParams?: URLSearchParams): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const candidate = authHeader.slice(7).trim();
    if (candidate) return candidate;
  }

  const customHeader = req.headers.get('x-stay-token');
  if (customHeader) return customHeader.trim();

  if (searchParams) {
    const param = searchParams.get('stayToken') || searchParams.get('token');
    if (param) return param.trim();
  }

  try {
    const url = new URL(req.url);
    const param = url.searchParams.get('stayToken') || url.searchParams.get('token');
    if (param) return param.trim();
  } catch {}

  return null;
}

/**
 * Validates tenant boundary: Ensures request belongs to the authorized hotel
 */
export function assertTenantAccess(sessionHotelId: string, requestedHotelId: string, role: string) {
  if (role === 'platform_admin') return; // Platform admin has cross-tenant audit access
  if (sessionHotelId !== requestedHotelId) {
    logAuditEvent({
      hotel_id: requestedHotelId,
      actor_role: role,
      action: 'CROSS_TENANT_ACCESS_DENIED',
      target_resource: 'tenant_boundary',
      details: { authorizedHotel: sessionHotelId, attemptedHotel: requestedHotelId },
    });
    throw new Error('Access denied: Cross-tenant isolation violation detected.');
  }
}
