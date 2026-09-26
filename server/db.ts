// server/db.ts
// Ultra-fast in-memory + Supabase integrated data layer with strict tenant isolation

import { GUEST_HOTELS_SEED, GUEST_MENU_SEED } from '@/db/seed/guest/guest_seed';
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

  public getOrders(hotelId: string, stayId?: string): Order[] {
    return this.orders.filter((o) => o.hotel_id === hotelId && (!stayId || o.stay_id === stayId));
  }

  public getRequests(hotelId: string, stayId?: string): ServiceRequest[] {
    return this.requests.filter((r) => r.hotel_id === hotelId && (!stayId || r.stay_id === stayId));
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

  // --- Invoicing & Billing ---
  public getOrCreateStayInvoice(stayId: string, hotelId: string): Invoice {
    const stay = this.stays.find((s) => s.id === stayId && s.hotel_id === hotelId);
    if (!stay) throw new Error('Stay not found.');

    let invoice = this.invoices.find((i) => i.stay_id === stayId);
    if (!invoice) {
      // Calculate all delivered or pending orders
      const stayOrders = this.getOrders(hotelId, stayId);
      const subtotalPaise = stayOrders.reduce((sum, o) => sum + o.subtotal_paise, 0);
      const taxPaise = stayOrders.reduce((sum, o) => sum + o.tax_paise, 0);
      const serviceChargePaise = stayOrders.reduce((sum, o) => sum + o.service_charge_paise, 0);
      const totalPaise = subtotalPaise + taxPaise + serviceChargePaise;

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
    }
    return invoice;
  }

  public recordPayment(params: {
    invoiceId: string;
    hotelId: string;
    amountPaise: number;
    idempotencyKey?: string;
  }) {
    const invoice = this.invoices.find((i) => i.id === params.invoiceId && i.hotel_id === params.hotelId);
    if (!invoice) throw new Error('Invoice not found.');

    invoice.status = 'paid';
    invoice.paid_at = new Date().toISOString();

    logAuditEvent({
      hotel_id: params.hotelId,
      actor_role: 'billing_service',
      action: 'PAYMENT_RECORDED',
      target_resource: `invoice:${invoice.id}`,
      details: { amountPaise: params.amountPaise, invoiceNumber: invoice.invoice_number },
    });

    return invoice;
  }
}

// Global Singleton for instant hot-reload persistence
export const db = new ResortBrainDatabase();
