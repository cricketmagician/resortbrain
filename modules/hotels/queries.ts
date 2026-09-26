// modules/hotels/queries.ts
// Public hotel read model (Contract request C1)
// Exposes only public branding, contact, and guest service info without exposing secrets, plans, or internal limits

import { db } from '@/server/db';

export type Currency = 'INR' | (string & {});

export interface PublicHotel {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  logoUrl?: string;
  bannerUrl?: string;
  accent: string;
  currency: Currency;
  timeZone: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
  };
  info: {
    wifiName?: string;
    checkoutTime?: string;
    breakfastHours?: string;
    poolHours?: string;
    deliveryEstimate?: string;
  };
  requestPresets: Record<string, { slug: string; label: string }[]>;
}

const DEFAULT_PRESETS: Record<string, { slug: string; label: string }[]> = {
  housekeeping: [
    { slug: 'extra-towels', label: 'Fresh Bath & Face Towels' },
    { slug: 'extra-water', label: 'Himalayan Spring Water Bottles' },
    { slug: 'pillow-menu', label: 'Hypoallergenic Feather Pillows' },
    { slug: 'turndown', label: 'Evening Turndown Service' },
  ],
  maintenance: [
    { slug: 'ac-adjust', label: 'Air Conditioning Temperature Adjustment' },
    { slug: 'tv-audio', label: 'Smart TV / Audio System Assistance' },
    { slug: 'wifi-connect', label: 'High-Speed Wi-Fi Support' },
  ],
  concierge: [
    { slug: 'luggage-pickup', label: 'Luggage Assistance & Bellhop' },
    { slug: 'late-checkout', label: 'Late Checkout Request' },
    { slug: 'airport-transfer', label: 'Private Airport Chauffeur' },
  ],
};

export function getPublicHotel(slugOrId: string): PublicHotel | null {
  const hotel = db.getHotel(slugOrId);
  if (!hotel) return null;

  return {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    shortName: hotel.name.replace(/ Resort.*| Hotel.*| & Spa.*/i, '').trim() || hotel.name,
    tagline: hotel.tagline || 'Bespoke Luxury Hospitality & Smart Guest Concierge',
    logoUrl: hotel.logo_url || undefined,
    bannerUrl: hotel.banner_url || undefined,
    accent: (hotel as any).primary_color || '#D4AF37',
    currency: hotel.currency || 'INR',
    timeZone: (hotel as any).timezone || 'Asia/Kolkata',
    contact: {
      phone: (hotel as any).contact_phone || '+91 800 245 7800',
      email: (hotel as any).contact_email || `concierge@${hotel.slug}.com`,
      address: (hotel as any).address || '108 Palace Road, Luxury Quarter',
      gstin: (hotel as any).gstin || '29AABCB1234F1Z8',
    },
    info: {
      wifiName: `${hotel.name.split(' ')[0]}_Guest_HighSpeed`,
      checkoutTime: '12:00 PM',
      breakfastHours: '07:00 AM – 10:30 AM',
      poolHours: '06:00 AM – 09:00 PM',
      deliveryEstimate: '25–35 mins',
    },
    requestPresets: DEFAULT_PRESETS,
  };
}
