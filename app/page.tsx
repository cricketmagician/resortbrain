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
  ArrowRight,
  Check,
  QrCode,
  LogOut,
  User,
  ExternalLink,
  Laptop,
  Smartphone,
  Star,
  Users,
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

interface HotelTenant {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  currency?: string;
}

interface LoggedInUser {
  name: string;
  email: string;
  role: string;
  hotelId: string;
  hotelName: string;
}

export default function ResortBrainPlatform() {
  // Theme state
  const [isDark, setIsDark] = useState(true);

  // App mode: 'landing' (SaaS Marketing Site) | 'dashboard' (Hotel Management Dashboard)
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');

  // Dashboard Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'kds' | 'desk' | 'rooms' | 'guest_preview' | 'security'>('overview');

  // Active Hotel & Logged-In User
  const [currentHotelId, setCurrentHotelId] = useState<string>('hotel-001');
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regSlug, setRegSlug] = useState('');
  const [regTagline, setRegTagline] = useState('');
  const [regManagerName, setRegManagerName] = useState('');
  const [regManagerEmail, setRegManagerEmail] = useState('');
  const [regRoomsCount, setRegRoomsCount] = useState(15);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Live Data states
  const [hotelsList, setHotelsList] = useState<HotelTenant[]>([
    { id: 'hotel-001', slug: 'grand-azure', name: 'Grand Azure Resort & Spa', tagline: 'Luxury Coastal Sanctuary' },
    { id: 'hotel-002', slug: 'heritage-palace', name: 'The Heritage Palace & Haveli', tagline: 'Regal Rajasthan Hospitality' },
  ]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Guest PWA Preview Cart State
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  // Service Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('Extra Plush Bath Towels');
  const [requestCategory, setRequestCategory] = useState<'housekeeping' | 'amenities' | 'front_desk'>('housekeeping');

  // Bill Settlement Modal State
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billSettled, setBillSettled] = useState(false);

  // Security test message
  const [securitySimulationMsg, setSecuritySimulationMsg] = useState<string | null>(null);

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Data Fetching
  const refreshData = async () => {
    try {
      const menuRes = await fetch(`/api/menu?hotelId=${currentHotelId}`);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.items || []);
      }

      const orderRes = await fetch(`/api/orders?hotelId=${currentHotelId}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrders(data.orders || []);
      }

      const reqRes = await fetch(`/api/requests?hotelId=${currentHotelId}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }

      const auditRes = await fetch(`/api/audit?hotelId=${currentHotelId}`);
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }

      const hotelsRes = await fetch('/api/hotels');
      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        if (data.hotels && data.hotels.length > 0) {
          setHotelsList(data.hotels);
        }
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentHotelId]);

  // Handle Hotel Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    try {
      const res = await fetch('/api/hotels/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          slug: regSlug.toLowerCase().trim().replace(/\s+/g, '-'),
          tagline: regTagline,
          managerName: regManagerName,
          managerEmail: regManagerEmail,
          roomsCount: Number(regRoomsCount),
          currency: 'INR',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Update hotel list
      setHotelsList((prev) => [...prev, data.hotel]);
      setCurrentHotelId(data.hotel.id);
      setLoggedInUser({
        name: data.manager.name,
        email: data.manager.email,
        role: 'hotel_manager',
        hotelId: data.hotel.id,
        hotelName: data.hotel.name,
      });

      setIsRegisterModalOpen(false);
      setViewMode('dashboard');
      setActiveTab('overview');
      await refreshData();
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  // Quick 1-Click Login Helper
  const handleQuickLogin = (role: 'manager' | 'chef' | 'desk', hotelId = 'hotel-001') => {
    const hotel = hotelsList.find((h) => h.id === hotelId) || hotelsList[0];
    setCurrentHotelId(hotel.id);

    if (role === 'manager') {
      setLoggedInUser({
        name: hotel.id === 'hotel-001' ? 'Vikram Oberoi' : 'Alok Nath',
        email: 'gm@resortbrain.com',
        role: 'hotel_manager',
        hotelId: hotel.id,
        hotelName: hotel.name,
      });
      setActiveTab('overview');
    } else if (role === 'chef') {
      setLoggedInUser({
        name: 'Chef Marco Bellini',
        email: 'chef@resortbrain.com',
        role: 'kitchen_chef',
        hotelId: hotel.id,
        hotelName: hotel.name,
      });
      setActiveTab('kds');
    } else {
      setLoggedInUser({
        name: 'Priya Sharma',
        email: 'desk@resortbrain.com',
        role: 'front_desk',
        hotelId: hotel.id,
        hotelName: hotel.name,
      });
      setActiveTab('desk');
    }

    setIsLoginModalOpen(false);
    setViewMode('dashboard');
  };

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
      stayToken: currentHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : `token_${currentHotel?.slug || 'hotel'}_room_101`,
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

  // Service Request
  const handleCreateRequest = async () => {
    const payload = {
      stayToken: currentHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : `token_${currentHotel?.slug || 'hotel'}_room_101`,
      category: requestCategory,
      title: requestTitle,
      details: 'Prompt guest request via mobile concierge.',
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

  // Order Transition Action
  const handleOrderTransition = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-hotel-id': currentHotelId,
          'x-user-role': loggedInUser?.role || 'kitchen_chef',
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

  // Request Transition Action
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
          actorName: loggedInUser?.name || 'Staff Lead',
        }),
      });

      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Request transition error:', err);
    }
  };

  // Cross-tenant Intrusion Test
  const handleSimulateCrossTenantBreach = async () => {
    setSecuritySimulationMsg('Initiating cross-tenant intrusion check: Foreign staff trying to mutate another hotel order...');
    try {
      const targetHotel = currentHotelId === 'hotel-001' ? 'hotel-002' : 'hotel-001';
      const breachRes = await fetch(`/api/orders/ord-001`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-hotel-id': targetHotel,
          'x-user-role': 'kitchen_chef',
        },
        body: JSON.stringify({ nextStatus: 'delivered' }),
      });

      if (!breachRes.ok) {
        const errorData = await breachRes.json();
        setSecuritySimulationMsg(`🛡️ ATTACK BLOCKED: ${errorData.error} (Status: 400/403 Forbidden). Cross-tenant leakage strictly prevented by PostgreSQL RLS.`);
      } else {
        setSecuritySimulationMsg('Warning: Unauthorized mutation was not blocked.');
      }
      await refreshData();
    } catch (err) {
      setSecuritySimulationMsg(`Intrusion prevented: ${String(err)}`);
    }
  };

  const currentHotel = hotelsList.find((h) => h.id === currentHotelId) || hotelsList[0];
  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* ========================================================================= */}
      {/* MODE 1: RESORTBRAIN SAAS MARKETING WEBSITE */}
      {/* ========================================================================= */}
      {viewMode === 'landing' && (
        <div className="flex flex-col min-h-screen">
          {/* SaaS Navigation */}
          <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0f172a]/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg">
                  RB
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-500 via-amber-300 to-amber-200 bg-clip-text text-transparent">
                      ResortBrain
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                      SaaS
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Hotel Operations Platform</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <a href="#features" className="hover:text-amber-500 transition-colors">Features</a>
                <a href="#kds" className="hover:text-amber-500 transition-colors">Kitchen KDS</a>
                <a href="#security" className="hover:text-amber-500 transition-colors">Multi-Tenancy Security</a>
                <a href="#pricing" className="hover:text-amber-500 transition-colors">Pricing</a>
              </div>

              {/* Header Right CTAs */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-800 dark:text-slate-200 transition-all shadow-sm"
                >
                  Staff Log In
                </button>

                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 hover:brightness-105 shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Register Hotel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200 dark:border-slate-800/80">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Luxury Hotel Operations SaaS • v3.0
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1]">
                The Operating System for Modern <span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">Luxury Hotels & Resorts</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Empower your guests with instant zero-install QR dining, streamline your kitchen with live chimes, automate task SLA escalations, and protect your brand with bulletproof multi-tenant database isolation.
              </p>

              {/* Main CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-7 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 hover:scale-105 shadow-2xl transition-all flex items-center gap-2"
                >
                  <Building className="w-4 h-4" />
                  <span>Onboard Your Hotel (14-Day Free Trial)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleQuickLogin('manager', 'hotel-001')}
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-amber-500 text-slate-800 dark:text-slate-200 hover:scale-105 shadow-lg transition-all flex items-center gap-2"
                >
                  <Laptop className="w-4 h-4 text-amber-500" />
                  <span>Explore Live Working Demo</span>
                </button>
              </div>

              {/* Hero Stats */}
              <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
                  <div className="text-2xl sm:text-3xl font-black text-amber-500">&lt; 1.2s</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Guest PWA Load Speed</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">&lt; 500ms</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kitchen Chime Latency</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-500">100%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">RLS Multi-Tenant Isolation</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">0 App Downloads</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant Web PWA Access</div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Highlights */}
          <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2">Architected for Perfection</h2>
              <p className="text-3xl sm:text-4xl font-black tracking-tight">Everything a 5-Star Hotel Needs in One Dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Zero-Install Guest PWA</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Guests scan the bedside QR code and instantly browse your culinary menu, order room dining, request spa amenities, and track status live on their phone.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-amber-500 flex items-center gap-1">
                  <span>PWA & Service Worker enabled</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Kitchen Display System (KDS)</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    High-contrast touch workspace built for kitchen tablets. Features synthesized bell chimes on incoming tickets and state transitions: Pending ➔ Cooking ➔ Ready ➔ Delivered.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-amber-500 flex items-center gap-1">
                  <span>Zero-delay Audio Chime</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Multi-Tenant PostgreSQL Isolation</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Strict Row-Level Security (RLS) on all hotel entities. Automated security audit logging and server-authoritative GST pricing prevent any tampering or cross-hotel leaks.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span>CI Cross-Tenant Verified</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2">Transparent SaaS Plans</h2>
                <p className="text-3xl sm:text-4xl font-black tracking-tight">Scale From Boutique Villas to Grand Hotel Chains</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Plan 1 */}
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg">Boutique Villa</h3>
                    <p className="text-xs text-slate-500 mt-1">Up to 20 luxury rooms</p>
                    <div className="mt-4 text-3xl font-black text-amber-500">
                      ₹4,999<span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Guest Dining PWA</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> 1 Kitchen Display Station</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> QR Code Generator</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="mt-8 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-all"
                  >
                    Select Boutique Plan
                  </button>
                </div>

                {/* Plan 2: Pro */}
                <div className="p-6 rounded-3xl border-2 border-amber-500 bg-white dark:bg-slate-900 shadow-2xl relative flex flex-col justify-between">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    Most Popular
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg">Resort & Spa Pro</h3>
                    <p className="text-xs text-slate-500 mt-1">Up to 100 rooms & suites</p>
                    <div className="mt-4 text-3xl font-black text-amber-500">
                      ₹12,499<span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Unlimited Guest PWA Sessions</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Multi-Station Kitchen KDS with Chimes</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Automated SLA Escalations</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Manager Executive Analytics</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="mt-8 w-full py-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg hover:brightness-105 transition-all"
                  >
                    Start 14-Day Free Trial
                  </button>
                </div>

                {/* Plan 3: Enterprise */}
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg">Heritage Enterprise</h3>
                    <p className="text-xs text-slate-500 mt-1">Multi-property hotel groups</p>
                    <div className="mt-4 text-3xl font-black text-amber-500">
                      ₹24,999<span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Dedicated Cloud Database Instance</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Opera / PMS Direct Integration</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500" /> Custom Domain & Brand Whitelabel</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="mt-8 w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-all"
                  >
                    Contact Enterprise Sales
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            <p>© 2026 ResortBrain Inc. Engineered for Conclave 2026 with Multi-Tenant Architecture.</p>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: LOGGED-IN HOTEL OPERATING DASHBOARD */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' && (
        <div className="flex h-screen overflow-hidden">
          {/* Dashboard Left Sidebar */}
          <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 flex-shrink-0">
            <div className="space-y-6">
              {/* Hotel Brand Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-extrabold text-slate-950 text-base shadow">
                  RB
                </span>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm truncate">{currentHotel.name}</div>
                  <div className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                    <Building className="w-3 h-3" /> Tenant: {currentHotel.slug}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Executive Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('kds')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'kds'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4" />
                    <span>Kitchen Workspace</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-slate-900 dark:text-amber-300">
                    {orders.filter((o) => o.status !== 'delivered').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('desk')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'desk'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ConciergeBell className="w-4 h-4" />
                    <span>Front Desk & Tasks</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-500">
                    {requests.filter((r) => r.status !== 'completed').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'rooms'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Rooms & Bedside QRs</span>
                </button>

                <button
                  onClick={() => setActiveTab('guest_preview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'guest_preview'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Live Guest PWA Sim</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    activeTab === 'security'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & Audit Logs</span>
                </button>
              </div>
            </div>

            {/* Sidebar Bottom Controls */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-bold truncate max-w-[120px]">{loggedInUser?.name || 'Staff User'}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{loggedInUser?.role?.replace('_', ' ') || 'Manager'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => setViewMode('landing')}
                className="w-full py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit to SaaS Site</span>
              </button>
            </div>
          </aside>

          {/* Dashboard Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            {/* Top Workspace Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold capitalize">
                  {activeTab === 'overview' && 'Executive Management Suite'}
                  {activeTab === 'kds' && 'Kitchen Display System (KDS)'}
                  {activeTab === 'desk' && 'Front Desk & Service Requests'}
                  {activeTab === 'rooms' && 'Room Inventory & QR Codes'}
                  {activeTab === 'guest_preview' && 'Guest PWA Mobile Experience'}
                  {activeTab === 'security' && 'Tenant Isolation & Security Audit'}
                </h2>
                <p className="text-xs text-slate-500">Live for {currentHotel.name}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Switch between seeded hotels or registered hotels */}
                <select
                  value={currentHotelId}
                  onChange={(e) => setCurrentHotelId(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:ring-1 focus:ring-amber-500"
                >
                  {hotelsList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => playKitchenChime()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Test Chime</span>
                </button>

                <button
                  onClick={refreshData}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Dashboard Sub-Tab Content */}
            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400">Total Revenue (Today)</span>
                      <div className="text-2xl font-black text-amber-500 mt-1">₹1,84,500.00</div>
                      <span className="text-[11px] text-emerald-500 font-bold">↑ 18.2% vs last week</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400">Active Kitchen Tickets</span>
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                        {orders.filter((o) => o.status !== 'delivered').length} Active
                      </div>
                      <span className="text-[11px] text-amber-500 font-bold">Avg prep time: 11.4 mins</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400">SLA Adherence Rate</span>
                      <div className="text-2xl font-black text-emerald-500 mt-1">98.6%</div>
                      <span className="text-[11px] text-slate-400">1 escalation resolved today</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400">Occupancy Rate</span>
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">87.5%</div>
                      <span className="text-[11px] text-amber-500 font-bold">High season volume</span>
                    </div>
                  </div>

                  {/* Recent Activity Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold text-sm">Live Order Pipeline</h3>
                      <button onClick={() => setActiveTab('kds')} className="text-xs text-amber-500 font-bold flex items-center gap-1">
                        Open Full KDS <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs">
                              {order.room_number.split(' ')[1] || 'RM'}
                            </span>
                            <div>
                              <div className="font-bold text-sm">{order.order_number} • {order.room_number}</div>
                              <div className="text-xs text-slate-400">
                                {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">₹{(order.total_paise / 100).toFixed(2)}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-500">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KITCHEN WORKSPACE */}
              {activeTab === 'kds' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {orders
                      .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
                      .map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-slate-900 p-5 shadow-lg flex flex-col justify-between"
                        >
                          <div>
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
                              <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-amber-500/20 text-amber-500">
                                {order.status}
                              </span>
                            </div>

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
                                Start Cooking
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => handleOrderTransition(order.id, 'ready')}
                                className="w-full py-2.5 rounded-xl font-black text-xs bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow"
                              >
                                Mark Ready
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

              {/* TAB 3: FRONT DESK & HOUSEKEEPING */}
              {activeTab === 'desk' && (
                <div className="space-y-6">
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-500">
                              {req.priority}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{req.details}</p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500" /> SLA: {req.sla_minutes}m target
                            </span>
                            {req.assigned_name && <span className="text-slate-300">Assigned: {req.assigned_name}</span>}
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

              {/* TAB 4: ROOMS & QR CODES */}
              {activeTab === 'rooms' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-base">Room Inventory & Guest QR Codes</h3>
                      <p className="text-xs text-slate-500">
                        Print bedside QR codes for each villa. Guests scan with iPhone or Android camera to access their stay.
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print All QR Standees
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { room: 'Room 101', type: 'Ocean Villa', qr: `QR_${currentHotel.slug.toUpperCase()}_101` },
                      { room: 'Room 102', type: 'Royal Suite', qr: `QR_${currentHotel.slug.toUpperCase()}_102` },
                      { room: 'Room 204', type: 'Garden Villa', qr: `QR_${currentHotel.slug.toUpperCase()}_204` },
                      { room: 'Room 304', type: 'Deluxe Suite', qr: `QR_${currentHotel.slug.toUpperCase()}_304` },
                    ].map((rm, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3 shadow-sm"
                      >
                        <div className="w-28 h-28 mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-dashed border-amber-500/50 p-2">
                          <QrCode className="w-20 h-20 text-slate-800 dark:text-amber-400" />
                        </div>
                        <div>
                          <div className="font-extrabold text-base">{rm.room}</div>
                          <div className="text-xs text-slate-400">{rm.type}</div>
                          <div className="font-mono text-[10px] text-amber-500 mt-1">{rm.qr}</div>
                        </div>
                        <button
                          onClick={() => setActiveTab('guest_preview')}
                          className="w-full py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-amber-500 flex items-center justify-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Launch Guest View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: GUEST PWA SIMULATOR */}
              {activeTab === 'guest_preview' && (
                <div className="space-y-6">
                  {/* Guest Top Card */}
                  <div className="rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 text-white shadow-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
                      <KeyRound className="w-3.5 h-3.5" /> Room 304 • Active Guest Stay
                    </div>
                    <h3 className="text-2xl font-black">{currentHotel.name}</h3>
                    <p className="text-xs text-slate-300 mt-1">Guest: Dr. Siddharth Verma</p>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5"
                      >
                        <ConciergeBell className="w-4 h-4 text-amber-400" />
                        Request Service / Towels
                      </button>
                      <button
                        onClick={() => setIsBillOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow flex items-center gap-1.5"
                      >
                        <Receipt className="w-4 h-4" />
                        View Room Folio & Checkout
                      </button>
                    </div>
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
                                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add to Order
                              </button>
                            ) : (
                              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-1">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-extrabold text-sm text-amber-500">{inCartQty} in cart</span>
                                <button
                                  onClick={() => addToCart(item.id)}
                                  className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold"
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
                          {cartItemsCount} items • ₹{(cartTotalPaise / 100).toFixed(2)}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SECURITY & AUDIT TRAIL */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-950/40 to-slate-900 border-l-4 border-l-emerald-500">
                    <h3 className="text-lg font-extrabold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Cross-Tenant Row-Level Security Verification
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Prove to judges that Hotel A cannot mutate or read Hotel B data. Click the button below to execute a simulated breach.
                    </p>

                    <div className="mt-4">
                      <button
                        onClick={handleSimulateCrossTenantBreach}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Execute Simulated Cross-Tenant Attack
                      </button>
                    </div>

                    {securitySimulationMsg && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400">
                        {securitySimulationMsg}
                      </div>
                    )}
                  </div>

                  {/* Audit Logs */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold text-sm">Real-time Append-Only Audit Stream</h3>
                      <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-96 overflow-y-auto font-mono text-xs">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-[11px]">{new Date(log.created_at).toLocaleTimeString()}</span>
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
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. HOTEL REGISTRATION / ONBOARDING MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950">
                  <Building className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-lg">Onboard Your Hotel</h3>
                  <p className="text-xs text-slate-500">Create new multi-tenant instance</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold">
                  {regError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Hotel / Resort Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taj Lake Palace, Udaipur"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (!regSlug) setRegSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tenant Slug (Identifier)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. taj-lake"
                    value={regSlug}
                    onChange={(e) => setRegSlug(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Room Count</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={regRoomsCount}
                    onChange={(e) => setRegRoomsCount(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Tagline / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Regal Island Palace & Luxury Dining"
                  value={regTagline}
                  onChange={(e) => setRegTagline(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">General Manager Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjeev Kapoor"
                    value={regManagerName}
                    onChange={(e) => setRegManagerName(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Manager Email</label>
                  <input
                    type="email"
                    required
                    placeholder="gm@tajhotels.com"
                    value={regManagerEmail}
                    onChange={(e) => setRegManagerEmail(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-xl hover:brightness-105 transition-all flex items-center justify-center gap-2"
                >
                  {regLoading ? 'Provisioning Hotel Instance...' : 'Create Hotel Tenant & Launch Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. STAFF & MANAGER LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Staff & Manager Login
              </h3>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Select a pre-configured role to immediately enter that workspace or test role-based access:
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  const leela = hotelsList.find((h) => h.slug === 'the-leela-palace') || hotelsList[0];
                  setCurrentHotelId(leela.id);
                  setLoggedInUser({
                    name: 'Nihal Kumar (General Manager)',
                    email: 'nihal.gm@leelapalace.com',
                    role: 'hotel_manager',
                    hotelId: leela.id,
                    hotelName: 'The Leela Palace Resort & Spa',
                  });
                  setActiveTab('overview');
                  setIsLoginModalOpen(false);
                  setViewMode('dashboard');
                }}
                className="w-full p-3.5 rounded-2xl border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-left flex items-center justify-between group shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-500">Nihal Kumar (General Manager)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-500 text-slate-950">Active Tenant</span>
                  </div>
                  <div className="text-xs text-slate-300">The Leela Palace Resort & Spa • Executive Suite</div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickLogin('manager', 'hotel-001')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm group-hover:text-amber-500">Vikram Oberoi (General Manager)</div>
                  <div className="text-xs text-slate-400">Grand Azure Resort • Executive Suite</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              </button>

              <button
                onClick={() => handleQuickLogin('chef', 'hotel-001')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm group-hover:text-amber-500">Chef Marco Bellini (Kitchen Chef)</div>
                  <div className="text-xs text-slate-400">Grand Azure Resort • Kitchen Display (KDS)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              </button>

              <button
                onClick={() => handleQuickLogin('desk', 'hotel-001')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm group-hover:text-amber-500">Priya Sharma (Front Desk Lead)</div>
                  <div className="text-xs text-slate-400">Grand Azure Resort • Task & SLA Queue</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              </button>

              <button
                onClick={() => handleQuickLogin('manager', 'hotel-002')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm group-hover:text-amber-500">Alok Nath (GM - The Heritage Palace)</div>
                  <div className="text-xs text-slate-400">Heritage Palace (Hotel B) • Multi-Tenant Test</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = menuItems.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-xs text-amber-500 font-bold">₹{((item.price_paise * qty) / 100).toFixed(2)}</div>
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

              <div className="mt-2">
                <label className="text-xs font-bold text-slate-400">Special Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Mild spice, extra napkins"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{(cartTotalPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18% Server Calculated)</span>
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
                Place Order to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
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
                  <option value="front_desk">Front Desk & Luggage</option>
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

              <div className="flex gap-2 pt-2">
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

      {/* Bill Modal */}
      {isBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Room Folio Settle
              </h3>
              <button onClick={() => setIsBillOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex justify-between text-slate-400">
                <span>Room Dining & Amenities:</span>
                <span className="font-bold text-white">₹1,050.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="font-bold text-white">₹189.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service Charge (5%):</span>
                <span className="font-bold text-white">₹52.50</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 dark:border-slate-700 text-amber-500">
                <span>Total Due:</span>
                <span>₹1,291.50</span>
              </div>

              {billSettled ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <div className="text-emerald-500 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Paid in Test Mode
                  </div>
                  <p className="text-[10px] text-slate-400">Invoice settled.</p>
                </div>
              ) : (
                <button
                  onClick={() => setBillSettled(true)}
                  className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow hover:brightness-105"
                >
                  Pay & Settle (Test Mode)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
