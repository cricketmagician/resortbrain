'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  Utensils,
  ConciergeBell,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Building,
  KeyRound,
  Printer,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { playKitchenChime } from '@/components/sound';

interface MenuItem {
  id: string;
  hotel_id: string;
  category: string;
  name: string;
  description: string;
  price_paise: number;
  image_url: string;
  is_veg: boolean;
}

interface OrderItem {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

interface Order {
  id: string;
  hotel_id: string;
  room_number: string;
  order_number: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal_paise: number;
  tax_paise: number;
  service_charge_paise: number;
  total_paise: number;
  special_instructions?: string;
  created_at: string;
}

interface ServiceRequest {
  id: string;
  hotel_id: string;
  room_number: string;
  category: string;
  title: string;
  details?: string;
  status: 'created' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sla_minutes: number;
  escalation_sent: boolean;
  assigned_name?: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  hotel_id?: string;
  actor_role: string;
  action: string;
  target_resource: string;
  created_at: string;
  trace_id: string;
}

export default function ResortBrainApp() {
  // Theme State
  const [isDark, setIsDark] = useState(true);

  // Active Workspace: 'guest' | 'kitchen' | 'desk' | 'manager' | 'security'
  const [workspace, setWorkspace] = useState<'guest' | 'kitchen' | 'desk' | 'manager' | 'security'>('guest');

  // Multi-tenant selection: Hotel 1 (Grand Azure) vs Hotel 2 (The Heritage Palace)
  const [currentHotelId, setCurrentHotelId] = useState<'hotel-001' | 'hotel-002'>('hotel-001');

  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [specialNote, setSpecialNote] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('Extra Plush Bath Towels');
  const [requestCategory, setRequestCategory] = useState<'housekeeping' | 'amenities' | 'front_desk'>('housekeeping');
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billSettled, setBillSettled] = useState(false);

  // Cross-tenant breach test state
  const [securitySimulationMsg, setSecuritySimulationMsg] = useState<string | null>(null);

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load initial data for current hotel
  const refreshData = async () => {
    try {
      // 1. Menu
      const menuRes = await fetch(`/api/menu?hotelId=${currentHotelId}`);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.items || []);
      }

      // 2. Orders
      const orderRes = await fetch(`/api/orders?hotelId=${currentHotelId}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrders(data.orders || []);
      }

      // 3. Requests
      const reqRes = await fetch(`/api/requests?hotelId=${currentHotelId}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }

      // 4. Audit
      const auditRes = await fetch(`/api/audit?hotelId=${currentHotelId}`);
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentHotelId]);

  // Cart operations
  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const cartTotalPaise = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price_paise * qty : 0);
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (cartItemsCount === 0) return;

    const payload = {
      stayToken: currentHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : 'stay_token_heritage_maharaja',
      items: Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      specialInstructions: specialNote || undefined,
      idempotencyKey: `ord_idem_${Date.now()}`,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCart({});
        setSpecialNote('');
        setIsCartOpen(false);
        playKitchenChime();
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  // Submit Service Request
  const handleCreateRequest = async () => {
    const payload = {
      stayToken: currentHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : 'stay_token_heritage_maharaja',
      category: requestCategory,
      title: requestTitle,
      details: 'Guest requested prompt service via mobile PWA.',
      priority: 'high',
      slaMinutes: 10,
    };

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsRequestModalOpen(false);
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to create request:', err);
    }
  };

  // Kitchen Order Transition
  const handleOrderTransition = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-hotel-id': currentHotelId,
          'x-user-role': 'kitchen_chef',
        },
        body: JSON.stringify({ nextStatus }),
      });

      if (res.ok) {
        playKitchenChime();
        await refreshData();
      }
    } catch (err) {
      console.error('Transition error:', err);
    }
  };

  // Request Transition
  const handleRequestTransition = async (requestId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-hotel-id': currentHotelId,
        },
        body: JSON.stringify({
          nextStatus,
          actorName: 'Priya Sharma (Front Desk)',
          actorId: 'user-002',
        }),
      });

      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Request transition error:', err);
    }
  };

  // Test Invisible Security (Cross-Tenant Breach Simulation)
  const handleSimulateCrossTenantBreach = async () => {
    setSecuritySimulationMsg('Running cross-tenant intrusion check: Hotel A staff trying to mutate Hotel B order...');
    try {
      // Find an order belonging to the OTHER hotel
      const targetHotel = currentHotelId === 'hotel-001' ? 'hotel-002' : 'hotel-001';
      const breachRes = await fetch(`/api/orders/ord-001`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-hotel-id': targetHotel, // Cross-tenant forgery attempt
          'x-user-role': 'kitchen_chef',
        },
        body: JSON.stringify({ nextStatus: 'delivered' }),
      });

      if (!breachRes.ok) {
        const errorData = await breachRes.json();
        setSecuritySimulationMsg(`🛡️ ATTACK BLOCKED: ${errorData.error} (Status: ${breachRes.status} Forbidden). Event written to immutable audit logs.`);
      } else {
        setSecuritySimulationMsg('Warning: Breach not blocked');
      }
      await refreshData();
    } catch (err) {
      setSecuritySimulationMsg(`Intrusion strictly blocked by Row-Level Security: ${String(err)}`);
    }
  };

  // Settle Bill
  const handleSettleBill = async () => {
    const payload = {
      invoiceId: `inv_${Date.now()}`,
      stayToken: currentHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : 'stay_token_heritage_maharaja',
      amountPaise: 129150,
      paymentMethod: 'card_test',
      idempotencyKey: `settle_${Date.now()}`,
    };

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBillSettled(true);
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to settle bill:', err);
    }
  };

  const hotelTitle = currentHotelId === 'hotel-001' ? 'Grand Azure Resort & Spa' : 'The Heritage Palace';
  const hotelRoom = currentHotelId === 'hotel-001' ? 'Room 304' : 'Maharaja Suite 1';
  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Universal Control Bar */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors bg-white/80 dark:bg-[#0f172a]/90 border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Tenant Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-md">
                RB
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">
                    ResortBrain
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    v3.0 Multi-Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-amber-500" />
                  {hotelTitle}
                </p>
              </div>
            </div>

            {/* Tenant Switcher (Hotel A vs Hotel B) */}
            <div className="hidden sm:flex items-center ml-4 pl-3 border-l border-slate-300 dark:border-slate-800 text-xs gap-1.5">
              <span className="text-slate-400">Tenant:</span>
              <button
                onClick={() => setCurrentHotelId('hotel-001')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentHotelId === 'hotel-001'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Grand Azure (A)
              </button>
              <button
                onClick={() => setCurrentHotelId('hotel-002')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentHotelId === 'hotel-002'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Heritage Palace (B)
              </button>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Dark / Night Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 transition-colors shadow-sm"
              title="Toggle Night / Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Chime Test Button */}
            <button
              onClick={() => playKitchenChime()}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-500 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-medium"
              title="Test Kitchen Sound Alert"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">Chime</span>
            </button>

            {/* Refresh */}
            <button
              onClick={refreshData}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Member 1 Platform Owner Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Member 1: Platform & Backend Lead
            </div>
          </div>
        </div>

        {/* Workspace Nav Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-2 py-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setWorkspace('guest')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              workspace === 'guest'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            📱 Guest PWA ({hotelRoom})
          </button>

          <button
            onClick={() => setWorkspace('kitchen')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              workspace === 'kitchen'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            🍳 Kitchen Workspace ({orders.filter((o) => o.status !== 'delivered').length})
          </button>

          <button
            onClick={() => setWorkspace('desk')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              workspace === 'desk'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ConciergeBell className="w-3.5 h-3.5" />
            🛎️ Front Desk & Housekeeping ({requests.filter((r) => r.status !== 'completed').length})
          </button>

          <button
            onClick={() => setWorkspace('manager')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              workspace === 'manager'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            📊 Manager Control Suite
          </button>

          <button
            onClick={() => setWorkspace('security')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              workspace === 'security'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            🛡️ Security & Audit Trail ({auditLogs.length})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ========================================================================= */}
        {/* VIEW 1: GUEST PWA EXPERIENCE */}
        {/* ========================================================================= */}
        {workspace === 'guest' && (
          <div className="space-y-6">
            {/* Guest Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-500/30">
                  <KeyRound className="w-3.5 h-3.5" /> Active Stay Verified • {hotelRoom}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to {hotelTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Tap below to order gourmet room dining or request instant guest services. No app install required.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white backdrop-blur-md"
                  >
                    <ConciergeBell className="w-4 h-4 text-amber-400" />
                    Request Towels & Housekeeping
                  </button>
                  <button
                    onClick={() => setIsBillOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md font-bold"
                  >
                    <Receipt className="w-4 h-4" />
                    View Room Folio & Checkout
                  </button>
                </div>
              </div>
            </div>

            {/* Live Order Status Timeline (If guest has orders) */}
            {orders.length > 0 && (
              <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Active Room Dining Order ({orders[0].order_number})
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Status: {orders[0].status}
                  </span>
                </div>

                {/* Stepper */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs pt-2">
                  {[
                    { key: 'pending', label: 'Placed' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'preparing', label: 'In Kitchen' },
                    { key: 'ready', label: 'With Runner' },
                    { key: 'delivered', label: 'Delivered' },
                  ].map((step, idx) => {
                    const stepOrder = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];
                    const currentIdx = stepOrder.indexOf(orders[0].status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-all ${
                            isDone
                              ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          } ${isCurrent ? 'animate-pulse' : ''}`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] font-medium ${isDone ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Menu Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Veg Only Filter */}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                🥬 Vegetarian Only
              </label>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const inCartQty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.is_veg
                                ? 'bg-emerald-500/90 text-white'
                                : 'bg-rose-500/90 text-white'
                            }`}
                          >
                            {item.is_veg ? 'Pure Veg' : 'Non-Veg'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base leading-snug group-hover:text-amber-500 transition-colors">
                            {item.name}
                          </h4>
                          <span className="font-extrabold text-amber-500 whitespace-nowrap">
                            ₹{(item.price_paise / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      {inCartQty === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to Order
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-xl p-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-sm text-amber-500">{inCartQty} in cart</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Cart Button */}
            {cartItemsCount > 0 && (
              <div className="fixed bottom-6 right-6 z-30">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-5 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-extrabold shadow-2xl flex items-center gap-3 hover:scale-105 transition-all text-sm"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>
                    {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} • ₹
                    {(cartTotalPaise / 100).toFixed(2)}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: KITCHEN WORKSPACE */}
        {/* ========================================================================= */}
        {workspace === 'kitchen' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  Kitchen Display System (KDS)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time ticket queue for Chef Marco • Audio chime enabled • High contrast touch controls
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playKitchenChime()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" /> Test Audio Chime
                </button>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {orders.filter((o) => o.status !== 'delivered').length} Active Tickets
                </span>
              </div>
            </div>

            {/* Orders Queue Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders
                .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
                .map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-slate-900 p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                              {order.order_number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {order.room_number}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Ordered {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            order.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-500 animate-pulse'
                              : order.status === 'accepted'
                              ? 'bg-blue-500/20 text-blue-400'
                              : order.status === 'preparing'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="py-4 space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm font-semibold">
                            <span>
                              <span className="text-amber-500 font-black mr-2">{item.quantity}x</span>
                              {item.itemName}
                            </span>
                            <span className="text-xs text-slate-400">₹{(item.totalPricePaise / 100).toFixed(0)}</span>
                          </div>
                        ))}

                        {order.special_instructions && (
                          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs">
                            <span className="font-bold">Guest Note:</span> {order.special_instructions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Mutation Action Buttons */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleOrderTransition(order.id, 'accepted')}
                          className="w-full py-2.5 rounded-xl font-black text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow"
                        >
                          Accept Ticket
                        </button>
                      )}
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleOrderTransition(order.id, 'preparing')}
                          className="w-full py-2.5 rounded-xl font-black text-xs bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleOrderTransition(order.id, 'ready')}
                          className="w-full py-2.5 rounded-xl font-black text-xs bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow"
                        >
                          Mark Ready for Runner
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleOrderTransition(order.id, 'delivered')}
                          className="w-full py-2.5 rounded-xl font-black text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow"
                        >
                          Confirm Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FRONT DESK & HOUSEKEEPING */}
        {/* ========================================================================= */}
        {workspace === 'desk' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <ConciergeBell className="w-5 h-5 text-amber-500" />
                  Front Desk & Housekeeping Service Hub
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Guest requests with SLA countdown timers • Auto-escalation triggered if SLA exceeded
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {requests.filter((r) => r.status !== 'completed').length} Pending Tasks
              </span>
            </div>

            {/* Requests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-amber-500">
                          {req.room_number} • {req.category}
                        </span>
                        <h4 className="font-extrabold text-base mt-2">{req.title}</h4>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          req.priority === 'urgent'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{req.details}</p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> SLA: {req.sla_minutes}m target
                      </span>
                      {req.assigned_name && (
                        <span className="font-medium text-slate-300">Assigned: {req.assigned_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                    {req.status === 'created' && (
                      <button
                        onClick={() => handleRequestTransition(req.id, 'acknowledged')}
                        className="w-full py-2 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                      >
                        Acknowledge & Assign
                      </button>
                    )}
                    {req.status === 'acknowledged' && (
                      <button
                        onClick={() => handleRequestTransition(req.id, 'in_progress')}
                        className="w-full py-2 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        Start Task
                      </button>
                    )}
                    {req.status === 'in_progress' && (
                      <button
                        onClick={() => handleRequestTransition(req.id, 'completed')}
                        className="w-full py-2 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                    {req.status === 'completed' && (
                      <div className="w-full py-2 text-center text-xs font-bold text-emerald-500 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: MANAGER EXECUTIVE SUITE */}
        {/* ========================================================================= */}
        {workspace === 'manager' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-500" />
                Executive Operations & Revenue Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live performance metrics for General Manager Vikram Oberoi • Multi-department velocity
              </p>
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-400">Total F&B Revenue</span>
                <div className="text-2xl font-black text-amber-500 mt-1">₹1,84,500.00</div>
                <span className="text-[11px] text-emerald-500 font-bold">↑ 18.2% vs last week</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-400">Avg Kitchen Prep Time</span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">11.4 mins</div>
                <span className="text-[11px] text-emerald-500 font-bold">Target &lt; 15 mins (Passing)</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-400">SLA Adherence Rate</span>
                <div className="text-2xl font-black text-emerald-500 mt-1">98.6%</div>
                <span className="text-[11px] text-slate-400">1 escalation resolved today</span>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs font-semibold text-slate-400">Active Room Occupancy</span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">87.5%</div>
                <span className="text-[11px] text-amber-500 font-bold">28 of 32 rooms occupied</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: SECURITY & AUDIT TRAIL (MEMBER 1 PLATFORM LEAD) */}
        {/* ========================================================================= */}
        {workspace === 'security' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-950/40 to-slate-900 border-l-4 border-l-emerald-500">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Platform Tenant Isolation & Security Audit
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Proves Row-Level Security (RLS) enforcement. Attackers or malicious clients attempting cross-tenant access are strictly blocked with append-only audit tracking.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSimulateCrossTenantBreach}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Run Simulated Cross-Tenant Intrusion Test
                </button>
              </div>

              {securitySimulationMsg && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400">
                  {securitySimulationMsg}
                </div>
              )}
            </div>

            {/* Audit Log Stream */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm">Real-time Append-Only Audit Stream</h3>
                <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-96 overflow-y-auto font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 text-[10px] uppercase">
                        {log.actor_role}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                      <span className="text-slate-500">→ {log.target_resource}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">trace:{log.trace_id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  Your Dining Cart
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Items */}
              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = menuItems.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-xs text-amber-500 font-bold">
                          ₹{((item.price_paise * qty) / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(id)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Request */}
              <div className="mt-2">
                <label className="text-xs font-bold text-slate-400">Special Culinary Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Mild spice, extra napkins, serve warm"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Total & Checkout */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{(cartTotalPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST Tax (18% Server Computed)</span>
                  <span>₹{((cartTotalPaise * 0.18) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Due</span>
                  <span className="text-amber-500">₹{((cartTotalPaise * 1.23) / 100).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 hover:brightness-105 shadow-xl transition-all"
              >
                Confirm & Place Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-extrabold flex items-center gap-2 mb-4">
              <ConciergeBell className="w-5 h-5 text-amber-500" />
              Request Guest Service
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Category</label>
                <select
                  value={requestCategory}
                  onChange={(e) => setRequestCategory(e.target.value as 'housekeeping' | 'amenities' | 'front_desk')}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="housekeeping">Housekeeping & Linens</option>
                  <option value="amenities">Toiletries & Spa Amenities</option>
                  <option value="front_desk">Front Desk & Luggage Assistance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Request Item</label>
                <input
                  type="text"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 font-black shadow"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill & Payment Modal */}
      {isBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Room Folio Invoice & Settle
              </h3>
              <button onClick={() => setIsBillOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Hotel:</span>
                <span className="font-bold">{hotelTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Guest / Room:</span>
                <span className="font-bold">Dr. Siddharth Verma ({hotelRoom})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono">INV-2026-3049</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-400">
                  <span>Room Dining & Amenities:</span>
                  <span>₹1,050.00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18%):</span>
                  <span>₹189.00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (5%):</span>
                  <span>₹52.50</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 dark:border-slate-700 text-amber-500">
                  <span>Total Payable:</span>
                  <span>₹1,291.50</span>
                </div>
              </div>

              {billSettled ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <div className="text-emerald-500 font-bold flex items-center justify-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Payment Succeeded (Test Mode)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Transaction Ref: tx_mock_2026_99341 • Digital receipt emailed to guest.
                  </p>
                  <button
                    onClick={() => window.print()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSettleBill}
                  className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg hover:brightness-105 transition-all"
                >
                  Pay & Settle Folio (Test Mode)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
