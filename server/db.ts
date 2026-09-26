// server/db.ts
// Ultra-fast in-memory + Supabase integrated data layer with strict tenant isolation

import { GUEST_HOTELS_SEED, GUEST_MENU_SEED, BASE_REQUEST_PRESETS } from '@/db/seed/guest/guest_seed';
import { OPS_STAFF_SEED, OPS_ROOMS_SEED, OPS_STAYS_SEED } from '@/db/seed/ops/ops_seed';
import { logAuditEvent } from './audit';
import { enqueueOutboxEvent } from './outbox';
import {
  validateOrderTransition,
  validateRequestTransition,
  validateStayTransition,
  OrderStatus,
  RequestStatus,
  StayStatus,
} from './state-machines';

export interface OrderItem {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface Order {
  id: string;
  hotel_id: string;
  stay_id: string;
  room_id: string;
  room_number: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal_paise: number;
  tax_paise: number;
  service_charge_paise: number;
  total_paise: number;
  special_instructions?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  hotel_id: string;
  stay_id: string;
  room_id: string;
  room_number: string;
  category: 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance';
  title: string;
  details?: string;
  status: RequestStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sla_minutes: number;
  escalation_sent: boolean;
  assigned_to?: string;
  assigned_name?: string;
  created_at: string;
  acknowledged_at?: string;
  completed_at?: string;
}

export interface Invoice {
  id: string;
  hotel_id: string;
  stay_id: string;
  invoice_number: string;
  subtotal_paise: number;
  tax_paise: number;
  service_charge_paise: number;
  total_paise: number;
  status: 'draft' | 'issued' | 'paid';
  created_at: string;
  paid_at?: string;
}

// Global In-Memory Store
class ResortBrainDatabase {
  public hotels = [...GUEST_HOTELS_SEED];
  public menuItems = [...GUEST_MENU_SEED];
  public staff = [...OPS_STAFF_SEED];
  public rooms = [...OPS_ROOMS_SEED];
  public stays = [...OPS_STAYS_SEED];
  public orders: Order[] = [];
  public requests: ServiceRequest[] = [];
  public invoices: Invoice[] = [];

  constructor() {
    this.seedDemoActivity();
  }

  private seedDemoActivity() {
    // Seed initial orders and requests for Hotel 1 to showcase dashboard immediately
    const initialOrder: Order = {
      id: 'ord-001',
      hotel_id: 'hotel-001',
      stay_id: 'stay-001',
      room_id: 'room-103',
      room_number: 'Room 304',
      order_number: 'RB-1001',
      status: 'preparing',
      items: [
        {
          menuItemId: 'item-001',
          itemName: 'Artisan Avocado Sourdough Tartine',
          quantity: 1,
          unitPricePaise: 55000,
          totalPricePaise: 55000,
        },
        {
          menuItemId: 'item-004',
          itemName: 'Fresh Royal Coconut Water',
          quantity: 2,
          unitPricePaise: 25000,
          totalPricePaise: 50000,
        },
      ],
      subtotal_paise: 105000,
      tax_paise: 18900,
      service_charge_paise: 5250,
      total_paise: 129150,
      special_instructions: 'Less ice in coconut water please',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    };
    this.orders.push(initialOrder);

    const initialRequest: ServiceRequest = {
      id: 'req-001',
      hotel_id: 'hotel-001',
      stay_id: 'stay-001',
      room_id: 'room-103',
      room_number: 'Room 304',
      category: 'housekeeping',
      title: 'Extra Plush Bath Towels & Aromatherapy Kit',
      details: 'Please deliver 2 extra bath sheets and lavender diffuser.',
      status: 'acknowledged',
      priority: 'high',
      sla_minutes: 15,
      escalation_sent: false,
      assigned_to: 'user-003',
      assigned_name: 'Rajesh Kumar',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      acknowledged_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    };
    this.requests.push(initialRequest);
  }

  // --- Multi-Tenant Scoped Queries ---

  public getHotel(hotelIdOrSlug: string) {
    return this.hotels.find((h) => h.id === hotelIdOrSlug || h.slug === hotelIdOrSlug) || null;
  }

  public getMenu(hotelId: string) {
    return this.menuItems.filter((item) => item.hotel_id === hotelId && item.is_available);
  }

  public getStayByToken(token: string) {
    return this.stays.find((s) => s.stay_token === token && s.status === 'active') || null;
  }

  public getStayByRoomQR(qrToken: string) {
    const room = this.rooms.find((r) => r.qr_code_token === qrToken);
    if (!room) return null;
    return this.stays.find((s) => s.room_id === room.id && s.status === 'active') || null;
  }

  public getRoomsWithStays(hotelId: string) {
    const hotelRooms = this.rooms.filter((r) => r.hotel_id === hotelId);
    return hotelRooms.map((r) => {
      const activeStay = this.stays.find((s) => s.room_id === r.id && s.status === 'active');
      return {
        ...r,
        activeStay: activeStay
          ? {
              id: activeStay.id,
              guestName: activeStay.guest_name,
              checkinPin: (activeStay as any).checkin_pin || '1234',
              checkIn: activeStay.check_in,
              checkOut: activeStay.check_out,
              stayToken: activeStay.stay_token,
            }
          : null,
      };
    });
  }

  public checkInGuest(params: {
    hotelId: string;
    roomId: string;
    guestName: string;
    checkOutDate?: string;
    customPin?: string;
  }) {
    const room = this.rooms.find((r) => r.id === params.roomId && r.hotel_id === params.hotelId);
    if (!room) {
      throw new Error('Room not found or does not belong to this hotel.');
    }

    // Mark previous active stays for this room as completed
    this.stays
      .filter((s) => s.room_id === room.id && s.status === 'active')
      .forEach((s) => {
        (s as any).status = 'completed';
      });

    const pin = params.customPin || Math.floor(1000 + Math.random() * 9000).toString();
    const stayId = `stay-${Date.now().toString().slice(-6)}`;
    const expiresAt = params.checkOutDate || new Date(Date.now() + 86400000 * 2).toISOString();
    const token = `rb_token_${params.hotelId}_${room.id}_${pin}`;

    const newStay = {
      id: stayId,
      hotel_id: room.hotel_id,
      room_id: room.id,
      room_number: room.room_number,
      guest_id: `guest-${Date.now().toString().slice(-4)}`,
      guest_name: params.guestName,
      status: 'active' as const,
      stay_token: token,
      checkin_pin: pin,
      check_in: new Date().toISOString(),
      check_out: expiresAt,
    };

    this.stays.push(newStay);
    room.status = 'occupied';

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'front_desk',
      action: 'GUEST_CHECKED_IN',
      target_resource: `room:${room.room_number}`,
      details: {
        guestName: params.guestName,
        roomNumber: room.room_number,
        checkinPin: pin,
        stayId,
      },
    });

    return { stay: newStay, pin };
  }

  public checkOutGuest(stayIdOrRoomId: string, hotelId: string) {
    const stay = this.stays.find(
      (s) =>
        (s.id === stayIdOrRoomId || s.room_id === stayIdOrRoomId) &&
        s.hotel_id === hotelId &&
        s.status === 'active'
    );

    if (!stay) {
      throw new Error('Active stay not found.');
    }

    (stay as any).status = 'completed';

    const room = this.rooms.find((r) => r.id === stay.room_id);
    if (room) {
      room.status = 'available';
    }

    logAuditEvent({
      hotel_id: hotelId,
      actor_role: 'front_desk',
      action: 'GUEST_CHECKED_OUT',
      target_resource: `stay:${stay.id}`,
      details: {
        guestName: stay.guest_name,
        roomNumber: stay.room_number,
      },
    });

    return { success: true };
  }

  public verifyStayPin(params: {
    hotelId?: string;
    qrToken?: string;
    roomId?: string;
    roomNumber?: string;
    pin: string;
  }) {
    let room = null;
    if (params.qrToken) {
      room = this.rooms.find((r) => r.qr_code_token === params.qrToken);
    } else if (params.roomId) {
      room = this.rooms.find((r) => r.id === params.roomId && (!params.hotelId || r.hotel_id === params.hotelId));
    } else if (params.roomNumber) {
      const q = params.roomNumber.toLowerCase().replace(/^(room|villa|suite)\s*/i, '').trim();
      room = this.rooms.find((r) => {
        const rNum = r.room_number.toLowerCase().replace(/^(room|villa|suite)\s*/i, '').trim();
        return (rNum === q || r.room_number.toLowerCase() === params.roomNumber?.toLowerCase()) &&
          (!params.hotelId || r.hotel_id === params.hotelId);
      });
    }

    if (!room) {
      return { success: false, error: 'Room could not be found from bedside QR code.' };
    }

    const activeStay = this.stays.find((s) => s.room_id === room.id && s.status === 'active');
    if (!activeStay) {
      return {
        success: false,
        error: `${room.room_number} is currently vacant. Please check in with Front Desk to receive your check-in PIN.`,
      };
    }

    const expectedPin = (activeStay as any).checkin_pin;
    if (expectedPin && expectedPin !== params.pin.trim()) {
      logAuditEvent({
        hotel_id: room.hotel_id,
        actor_role: 'guest',
        action: 'PIN_VERIFICATION_FAILED',
        target_resource: `room:${room.room_number}`,
        details: { attemptedPin: params.pin },
      });
      return {
        success: false,
        error: `Incorrect 4-digit PIN for ${room.room_number}. Please check your welcome card or Front Desk.`,
      };
    }

    const hotel = this.getHotel(room.hotel_id);

    logAuditEvent({
      hotel_id: room.hotel_id,
      actor_role: 'guest',
      action: 'PIN_VERIFICATION_SUCCESS',
      target_resource: `room:${room.room_number}`,
      details: { guestName: activeStay.guest_name, roomNumber: room.room_number },
    });

    return {
      success: true,
      session: {
        stayId: activeStay.id,
        hotelId: room.hotel_id,
        hotelSlug: hotel?.slug,
        hotelName: hotel?.name,
        roomId: room.id,
        roomNumber: room.room_number,
        roomType: room.room_type,
        guestName: activeStay.guest_name,
        stayToken: activeStay.stay_token,
        currency: hotel?.currency || 'INR',
        taxRate: Number(hotel?.tax_rate_percent || 18),
        serviceCharge: Number(hotel?.service_charge_percent || 5),
      },
    };
  }

  public getOrders(hotelId: string, stayId?: string): Order[] {
    return this.orders.filter((o) => o.hotel_id === hotelId && (!stayId || o.stay_id === stayId));
  }

  public getRequests(hotelId: string, stayId?: string): ServiceRequest[] {
    return this.requests.filter((r) => r.hotel_id === hotelId && (!stayId || r.stay_id === stayId));
  }

  // --- Hotel Onboarding / Registration ---
  public registerHotel(params: {
    name: string;
    slug: string;
    tagline?: string;
    managerName: string;
    managerEmail: string;
    currency?: string;
    roomsCount?: number;
  }) {
    const existing = this.hotels.find((h) => h.slug === params.slug);
    if (existing) {
      throw new Error(`Hotel with identifier "${params.slug}" already exists.`);
    }

    const hotelId = `hotel-${Date.now().toString().slice(-4)}`;
    const newHotel = {
      id: hotelId,
      slug: params.slug,
      name: params.name,
      short_name: params.name.slice(0, 15),
      tagline: params.tagline || 'Luxury Hospitality & Operations',
      accent: '#f2bd5c',
      time_zone: 'Asia/Kolkata',
      contact: {
        phone: '+91 80 5550 0100',
        email: params.managerEmail || 'concierge@example.com',
        address: `${params.name} Sanctuary Avenue, India`,
        gstin: '29AAAAA0000A1Z5',
      },
      request_presets: BASE_REQUEST_PRESETS,
      info: {
        wifi_name: `${params.name}-Guest`,
        checkout_time: '11:00',
        breakfast_hours: '07:00–10:30',
        pool_hours: '07:00–21:00',
        delivery_estimate: '25–35 min',
      },
      category_order: ['All-Day Gourmet Dining', 'Signature Grills', 'Beverages'],
      logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
      currency: params.currency || 'INR',
      tax_rate_percent: 18.0,
      service_charge_percent: 5.0,
      status: 'active',
    };

    this.hotels.push(newHotel);

    // Create Manager profile & membership
    const managerId = `user-${Date.now().toString().slice(-4)}`;
    this.staff.push({
      id: managerId,
      hotel_id: hotelId,
      email: params.managerEmail,
      fullName: params.managerName,
      role: 'hotel_manager',
    });

    // Populate initial default rooms
    const count = params.roomsCount || 12;
    for (let i = 1; i <= count; i++) {
      const roomNum = `Room ${100 + i}`;
      this.rooms.push({
        id: `room-${hotelId}-${i}`,
        hotel_id: hotelId,
        room_number: roomNum,
        room_type: i % 2 === 0 ? 'Royal Ocean Villa' : 'Deluxe Garden Sanctuary',
        status: i === 1 ? 'occupied' : 'available',
        qr_code_token: `QR_${params.slug.toUpperCase()}_${100 + i}`,
      });
    }

    // Populate starter gourmet menu items for this new hotel
    this.menuItems.push(
      {
        id: `item-${hotelId}-1`,
        hotel_id: hotelId,
        category: 'All-Day Gourmet Dining',
        name: 'Artisan Avocado Sourdough Tartine',
        description: 'Crushed Hass avocado, organic microgreens, heirloom cherry tomatoes.',
        price_paise: 55000,
        image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
        is_veg: true,
        allergen_tags: ['Gluten'],
        is_available: true,
        featured: true,
      },
      {
        id: `item-${hotelId}-2`,
        hotel_id: hotelId,
        category: 'Signature Grills',
        name: 'Wood-Fired Truffle Pizza',
        description: 'Buffalo mozzarella, wild forest porcini, truffle oil.',
        price_paise: 89000,
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
        is_veg: true,
        allergen_tags: ['Dairy'],
        is_available: true,
        featured: false,
      },
      {
        id: `item-${hotelId}-3`,
        hotel_id: hotelId,
        category: 'Beverages',
        name: 'Fresh Royal Coconut Water',
        description: 'Chilled tender coconut water served in shell.',
        price_paise: 25000,
        image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80',
        is_veg: true,
        allergen_tags: [],
        is_available: true,
        featured: false,
      }
    );

    // Initial Stay for Room 101 so guest PWA is instantly active
    this.stays.push({
      id: `stay-${hotelId}-1`,
      hotel_id: hotelId,
      room_id: `room-${hotelId}-1`,
      room_number: 'Room 101',
      guest_id: `guest-${hotelId}-1`,
      guest_name: `${params.managerName} (Guest Stay)`,
      status: 'active',
      stay_token: `token_${params.slug}_room_101`,
      checkin_pin: '1014',
      check_in: new Date().toISOString(),
      check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
    });

    logAuditEvent({
      hotel_id: hotelId,
      actor_role: 'hotel_manager',
      action: 'HOTEL_REGISTERED',
      target_resource: `hotel:${hotelId}`,
      details: { name: params.name, slug: params.slug, managerEmail: params.managerEmail },
    });

    return {
      hotel: newHotel,
      manager: {
        id: managerId,
        name: params.managerName,
        email: params.managerEmail,
        role: 'hotel_manager',
      },
    };
  }

  // --- Strict Server-Side Pricing Order Creation ---
  public createOrder(params: {
    hotelId: string;
    stayId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
    specialInstructions?: string;
    idempotencyKey?: string;
  }): Order {
    const hotel = this.getHotel(params.hotelId);
    if (!hotel) throw new Error('Hotel tenant not found.');

    const stay = this.stays.find((s) => s.id === params.stayId && s.hotel_id === params.hotelId);
    if (!stay) throw new Error('Active stay not found or tenant mismatch.');
    if (stay.status === 'checked_out') throw new Error('Cannot order on checked-out stay.');

    // Check Idempotency Key
    if (params.idempotencyKey) {
      const existing = this.orders.find((o) => o.idempotency_key === params.idempotencyKey);
      if (existing) return existing;
    }

    // SERVER-AUTHORITATIVE PRICING: Calculate strictly from menu catalog
    let subtotalPaise = 0;
    const computedItems: OrderItem[] = [];

    for (const item of params.items) {
      const menuItem = this.menuItems.find((m) => m.id === item.menuItemId && m.hotel_id === params.hotelId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} does not exist in this hotel.`);
      if (!menuItem.is_available) throw new Error(`Item ${menuItem.name} is currently unavailable.`);
      if (item.quantity <= 0) throw new Error('Quantity must be greater than zero.');

      const itemTotal = menuItem.price_paise * item.quantity;
      subtotalPaise += itemTotal;
      computedItems.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: item.quantity,
        unitPricePaise: menuItem.price_paise,
        totalPricePaise: itemTotal,
      });
    }

    const taxPaise = Math.round((subtotalPaise * (hotel.tax_rate_percent || 18)) / 100);
    const serviceChargePaise = Math.round((subtotalPaise * (hotel.service_charge_percent || 5)) / 100);
    const totalPaise = subtotalPaise + taxPaise + serviceChargePaise;

    const orderNumber = `RB-${1000 + this.orders.length + 1}`;
    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hotel_id: params.hotelId,
      stay_id: params.stayId,
      room_id: stay.room_id,
      room_number: stay.room_number,
      order_number: orderNumber,
      status: 'pending',
      items: computedItems,
      subtotal_paise: subtotalPaise,
      tax_paise: taxPaise,
      service_charge_paise: serviceChargePaise,
      total_paise: totalPaise,
      special_instructions: params.specialInstructions,
      idempotency_key: params.idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);

    // Enqueue transactional outbox event
    enqueueOutboxEvent(params.hotelId, 'order.created', {
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      roomNumber: newOrder.room_number,
      totalPaise: newOrder.total_paise,
      itemsCount: computedItems.length,
    });

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'guest',
      action: 'ORDER_PLACED',
      target_resource: `order:${newOrder.id}`,
      details: { orderNumber: newOrder.order_number, totalPaise: newOrder.total_paise },
    });

    return newOrder;
  }

  // --- Order Transition Action ---
  public transitionOrder(orderId: string, nextStatus: OrderStatus, hotelId: string, actorRole: string): Order {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found.');
    if (order.hotel_id !== hotelId) {
      logAuditEvent({
        hotel_id: hotelId,
        actor_role: actorRole,
        action: 'CROSS_TENANT_ORDER_MUTATION_DENIED',
        target_resource: `order:${orderId}`,
        details: { orderHotel: order.hotel_id, requestedHotel: hotelId },
      });
      throw new Error('Tenant violation: Access denied to another hotel order.');
    }

    validateOrderTransition(order.status, nextStatus);

    order.status = nextStatus;
    order.updated_at = new Date().toISOString();

    enqueueOutboxEvent(hotelId, `order.${nextStatus}`, {
      orderId: order.id,
      status: nextStatus,
      roomNumber: order.room_number,
    });

    logAuditEvent({
      hotel_id: hotelId,
      actor_role: actorRole,
      action: `ORDER_${nextStatus.toUpperCase()}`,
      target_resource: `order:${order.id}`,
    });

    return order;
  }

  // --- Service Request Creation ---
  public createRequest(params: {
    hotelId: string;
    stayId: string;
    category: 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance';
    title: string;
    details?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    slaMinutes?: number;
  }): ServiceRequest {
    const stay = this.stays.find((s) => s.id === params.stayId && s.hotel_id === params.hotelId);
    if (!stay) throw new Error('Active stay not found.');

    const newReq: ServiceRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hotel_id: params.hotelId,
      stay_id: params.stayId,
      room_id: stay.room_id,
      room_number: stay.room_number,
      category: params.category,
      title: params.title,
      details: params.details,
      status: 'created',
      priority: params.priority || 'normal',
      sla_minutes: params.slaMinutes || 15,
      escalation_sent: false,
      created_at: new Date().toISOString(),
    };

    this.requests.unshift(newReq);

    enqueueOutboxEvent(params.hotelId, 'request.created', {
      requestId: newReq.id,
      title: newReq.title,
      category: newReq.category,
      roomNumber: newReq.room_number,
      priority: newReq.priority,
    });

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'guest',
      action: 'SERVICE_REQUEST_CREATED',
      target_resource: `request:${newReq.id}`,
      details: { title: newReq.title, category: newReq.category },
    });

    return newReq;
  }

  // --- Service Request Transition Action ---
  public transitionRequest(
    requestId: string,
    nextStatus: RequestStatus,
    hotelId: string,
    actorId?: string,
    actorName?: string
  ): ServiceRequest {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found.');
    if (req.hotel_id !== hotelId) throw new Error('Tenant violation: Access denied.');

    validateRequestTransition(req.status, nextStatus);

    req.status = nextStatus;
    if (nextStatus === 'acknowledged') {
      req.acknowledged_at = new Date().toISOString();
      if (actorId) req.assigned_to = actorId;
      if (actorName) req.assigned_name = actorName;
    }
    if (nextStatus === 'completed') {
      req.completed_at = new Date().toISOString();
    }

    enqueueOutboxEvent(hotelId, `request.${nextStatus}`, {
      requestId: req.id,
      status: nextStatus,
      assignedTo: req.assigned_name,
    });

    return req;
  }

  // --- Order Quotation (No Side Effects) ---
  public quoteOrder(params: {
    hotelId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
  }) {
    const hotel = this.getHotel(params.hotelId);
    if (!hotel) throw new Error('Hotel tenant not found.');

    let subtotalPaise = 0;
    const lines: Array<{
      menuItemId: string;
      itemName: string;
      quantity: number;
      unitPricePaise: number;
      totalPricePaise: number;
    }> = [];

    for (const item of params.items) {
      const menuItem = this.menuItems.find((m) => m.id === item.menuItemId && m.hotel_id === params.hotelId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} does not exist in this hotel.`);
      if (!menuItem.is_available) throw new Error(`Item ${menuItem.name} is currently unavailable.`);
      if (item.quantity <= 0) throw new Error('Quantity must be greater than zero.');

      const itemTotal = menuItem.price_paise * item.quantity;
      subtotalPaise += itemTotal;
      lines.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: item.quantity,
        unitPricePaise: menuItem.price_paise,
        totalPricePaise: itemTotal,
      });
    }

    const taxPaise = Math.round((subtotalPaise * (hotel.tax_rate_percent || 18)) / 100);
    const serviceChargePaise = Math.round((subtotalPaise * (hotel.service_charge_percent || 5)) / 100);
    const totalPaise = subtotalPaise + taxPaise + serviceChargePaise;

    return {
      subtotal_paise: subtotalPaise,
      tax_paise: taxPaise,
      service_charge_paise: serviceChargePaise,
      total_paise: totalPaise,
      lines,
    };
  }

  // --- Invoicing & Billing ---
  public getOrCreateStayInvoice(stayId: string, hotelId: string): Invoice {
    const stay = this.stays.find((s) => s.id === stayId && s.hotel_id === hotelId);
    if (!stay) throw new Error('Stay not found.');

    let invoice = this.invoices.find((i) => i.stay_id === stayId);
    
    // Calculate all non-cancelled orders for this stay
    const stayOrders = this.getOrders(hotelId, stayId).filter((o) => o.status !== 'cancelled');
    const subtotalPaise = stayOrders.reduce((sum, o) => sum + o.subtotal_paise, 0);
    const taxPaise = stayOrders.reduce((sum, o) => sum + o.tax_paise, 0);
    const serviceChargePaise = stayOrders.reduce((sum, o) => sum + o.service_charge_paise, 0);
    const totalPaise = subtotalPaise + taxPaise + serviceChargePaise;

    if (!invoice) {
      invoice = {
        id: `inv_${Date.now()}`,
        hotel_id: hotelId,
        stay_id: stayId,
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        subtotal_paise: subtotalPaise,
        tax_paise: taxPaise,
        service_charge_paise: serviceChargePaise,
        total_paise: totalPaise,
        status: 'draft',
        created_at: new Date().toISOString(),
      };
      this.invoices.push(invoice);
    } else if (invoice.status === 'draft') {
      // Contract Request C7: Dynamically recompute totals for draft invoices so newly placed orders are included
      invoice.subtotal_paise = subtotalPaise;
      invoice.tax_paise = taxPaise;
      invoice.service_charge_paise = serviceChargePaise;
      invoice.total_paise = totalPaise;
    }

    return invoice;
  }

  // Set of processed payment idempotency keys
  private processedPaymentKeys = new Set<string>();

  public recordPayment(params: {
    invoiceId: string;
    hotelId: string;
    amountPaise: number;
    idempotencyKey?: string;
  }) {
    // Idempotency check
    if (params.idempotencyKey && this.processedPaymentKeys.has(params.idempotencyKey)) {
      const existing = this.invoices.find((i) => i.id === params.invoiceId && i.hotel_id === params.hotelId);
      if (existing) return existing;
    }

    const invoice = this.invoices.find((i) => i.id === params.invoiceId && i.hotel_id === params.hotelId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.status === 'paid') {
      return invoice;
    }

    // Verify payment amount matches invoice total
    if (params.amountPaise !== invoice.total_paise) {
      throw new Error(`Payment amount (${params.amountPaise} paise) must match invoice total (${invoice.total_paise} paise).`);
    }

    invoice.status = 'paid';
    invoice.paid_at = new Date().toISOString();

    if (params.idempotencyKey) {
      this.processedPaymentKeys.add(params.idempotencyKey);
    }

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'billing_service',
      action: 'PAYMENT_RECORDED',
      target_resource: `invoice:${invoice.id}`,
      details: { amountPaise: params.amountPaise, invoiceNumber: invoice.invoice_number, idempotencyKey: params.idempotencyKey },
    });

    return invoice;
  }

  // --- Guest Feedback Storage (Contract Request C5) ---
  public feedback: Array<{
    id: string;
    hotel_id: string;
    stay_id: string;
    guest_name: string;
    room_number: string;
    rating: number;
    tags: string[];
    comment?: string;
    invoice_id?: string;
    order_id?: string;
    created_at: string;
  }> = [];

  public submitFeedback(params: {
    hotelId: string;
    stayId: string;
    guestName: string;
    roomNumber: string;
    rating: number;
    tags?: string[];
    comment?: string;
    invoiceId?: string;
    orderId?: string;
  }) {
    const entry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hotel_id: params.hotelId,
      stay_id: params.stayId,
      guest_name: params.guestName,
      room_number: params.roomNumber,
      rating: Math.min(5, Math.max(1, params.rating)),
      tags: params.tags || [],
      comment: params.comment,
      invoice_id: params.invoiceId,
      order_id: params.orderId,
      created_at: new Date().toISOString(),
    };

    this.feedback.push(entry);

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'guest',
      action: 'GUEST_FEEDBACK_SUBMITTED',
      target_resource: `feedback:${entry.id}`,
      details: { rating: entry.rating, tags: entry.tags, comment: entry.comment },
    });

    return entry;
  }
}

// Global Singleton for instant hot-reload persistence
export const db = new ResortBrainDatabase();
