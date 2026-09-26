// lib/guest/types.ts
// Guest view-model types. camelCase, money is always `…Paise: number` (integer minor units),
// and times are ISO UTC strings. These are the ONLY shapes guest UI code should touch —
// the http and mock adapters map onto these, nothing else leaks through.

export type Currency = 'INR' | (string & {});

export type RequestCategory = 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance';

export interface RequestPreset {
  slug: string;
  label: string;
}

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
  contact: { phone?: string; email?: string; address?: string; gstin?: string };
  info: {
    wifiName?: string;
    checkoutTime?: string;
    breakfastHours?: string;
    poolHours?: string;
    deliveryEstimate?: string;
  };
  requestPresets: Record<RequestCategory, RequestPreset[]>;
}

export interface MenuItemVM {
  id: string;
  name: string;
  description?: string;
  category: string;
  categorySlug: string;
  pricePaise: number;
  currency: Currency;
  imageUrl?: string;
  isVeg: boolean;
  allergens: string[];
  available: boolean;
  featured?: boolean;
}

export interface GuestSession {
  stayToken: string;
  stayId: string;
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  currency: Currency;
  /** client clock, for the 10-minute background revalidation */
  validatedAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type RequestStatus = 'created' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PaymentMethod = 'card_test' | 'upi_test';

export interface OrderLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  roomNumber: string;
  lines: OrderLine[];
  subtotalPaise: number;
  taxPaise: number;
  serviceChargePaise: number;
  totalPaise: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  optimistic?: boolean;
}

export interface ServiceRequest {
  id: string;
  category: RequestCategory;
  title: string;
  details?: string;
  status: RequestStatus;
  priority: RequestPriority;
  roomNumber: string;
  assigneeFirstName?: string;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  optimistic?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'voided' | 'refunded';
  subtotalPaise: number;
  taxPaise: number;
  serviceChargePaise: number;
  discountPaise: number;
  totalPaise: number;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface Quote {
  subtotalPaise: number;
  taxPaise: number;
  serviceChargePaise: number;
  totalPaise: number;
}

export interface CartLine {
  menuItemId: string;
  quantity: number;
  note?: string;
}

export interface StayEvent {
  entity: 'order' | 'request' | 'invoice' | 'stay';
  id: string;
  status: string;
}
