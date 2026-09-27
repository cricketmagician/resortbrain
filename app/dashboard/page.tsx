'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Utensils,
  ConciergeBell,
  QrCode,
  ShieldCheck,
  BedDouble,
  Volume2,
  VolumeX,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Printer,
  ArrowUpRight,
  RefreshCw,
  Sun,
  Moon,
  Building,
  KeyRound,
  ChefHat,
  X,
  ArrowRight,
  Menu,
  LogOut,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import QRCode from 'qrcode';
import { playKitchenChime } from '@/components/sound';

interface OrderItem {
  menuItemId?: string;
  itemName?: string;
  name?: string;
  quantity: number;
  unitPricePaise?: number;
  price_paise?: number;
  totalPricePaise?: number;
}

interface Order {
  id: string;
  hotel_id?: string;
  room_number?: string;
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
  hotel_id?: string;
  room_number: string;
  category: string;
  title: string;
  details?: string;
  status: 'created' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sla_minutes?: number;
  created_at: string;
}

interface RoomWithStay {
  id: string;
  hotel_id: string;
  room_number: string;
  room_type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  qr_code_token: string;
  activeStay: {
    id: string;
    guestName: string;
    checkinPin: string;
    checkIn: string;
    checkOut: string;
    stayToken: string;
  } | null;
}

interface HotelTenant {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
}

export default function DashboardPage() {
  // Theme & Sound
  const [isDark, setIsDark] = useState(true);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'kds' | 'desk' | 'standees' | 'housekeeping' | 'audit'>('overview');

  // Active Hotel Tenant
  const [currentHotelId, setCurrentHotelId] = useState<string>('hotel-001');
  const [hotelsList, setHotelsList] = useState<HotelTenant[]>([
    { id: 'hotel-001', slug: 'grand-azure', name: 'Grand Azure Resort & Spa', tagline: '5-Star Luxury Coastal Sanctuary' },
    { id: 'hotel-002', slug: 'heritage-palace', name: 'Heritage Palace & Suites', tagline: 'Historic Royal Living' },
    { id: 'hotel-003', slug: 'leela-palace', name: 'The Leela Palace Luxury', tagline: 'Ultra-Luxury Modern Haven' },
  ]);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [roomsList, setRoomsList] = useState<RoomWithStay[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState<RoomWithStay | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [customPinInput, setCustomPinInput] = useState('');
  const [checkOutDaysInput, setCheckOutDaysInput] = useState(3);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [checkInSuccessBanner, setCheckInSuccessBanner] = useState<{ room: string; pin: string; guest: string } | null>(null);

  // Selected room for Standee view
  const [selectedStandeeRoom, setSelectedStandeeRoom] = useState<RoomWithStay | null>(null);

  // Fetch real data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 1. Orders
      const orderRes = await fetch(`/api/orders?hotelId=${currentHotelId}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        setOrders(data.orders || []);
      }

      // 2. Requests
      const reqRes = await fetch(`/api/requests?hotelId=${currentHotelId}`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }

      // 3. Rooms & Stays
      const roomsRes = await fetch(`/api/rooms?hotelId=${currentHotelId}`);
      if (roomsRes.ok) {
        const data = await roomsRes.json();
        if (data.rooms) {
          setRoomsList(data.rooms);
          if (!selectedStandeeRoom && data.rooms.length > 0) {
            setSelectedStandeeRoom(data.rooms[0]);
          }
        }
      }

      // 4. Audit
      const auditRes = await fetch(`/api/audit?hotelId=${currentHotelId}`);
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }

      // 5. Hotels
      const hotelsRes = await fetch('/api/hotels');
      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        if (data.hotels && data.hotels.length > 0) {
          setHotelsList(data.hotels);
        }
      }
    } catch (err) {
      console.error('Dashboard data refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [currentHotelId]);

  // Generate QR codes for rooms
  useEffect(() => {
    const generateQrs = async () => {
      if (typeof window === 'undefined' || roomsList.length === 0) return;
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const origin = isLocal ? `http://192.168.0.126:${window.location.port || '3000'}` : window.location.origin;
      const urls: Record<string, string> = {};

      const currentHotelSlug = hotelsList.find((h) => h.id === currentHotelId)?.slug || 'grand-azure';

      for (const room of roomsList) {
        const targetUrl = `${origin}/q/${room.qr_code_token}`;
        try {
          const dataUrl = await QRCode.toDataURL(targetUrl, {
            width: 320,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          urls[room.id] = dataUrl;
        } catch (e) {
          console.error('Error generating QR for room', room.room_number, e);
        }
      }
      setQrCodeDataUrls(urls);
    };

    generateQrs();
  }, [roomsList, currentHotelId, hotelsList]);

  // Calculations
  const currentHotel = hotelsList.find((h) => h.id === currentHotelId) || hotelsList[0];

  const totalRevenuePaise = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'preparing').length;
  }, [orders]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const preparingOrders = useMemo(
    () => orders.filter((o) => o.status === 'accepted' || o.status === 'preparing'),
    [orders]
  );
  const readyOrders = useMemo(() => orders.filter((o) => o.status === 'ready'), [orders]);

  const occupiedRoomsCount = useMemo(() => {
    return roomsList.filter((r) => r.status === 'occupied' || r.activeStay !== null).length;
  }, [roomsList]);

  const occupancyRate = useMemo(() => {
    if (roomsList.length === 0) return 84;
    return Math.round((occupiedRoomsCount / roomsList.length) * 100);
  }, [occupiedRoomsCount, roomsList.length]);

  // Order state transitions
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'accepted' | 'preparing' | 'ready' | 'delivered') => {
    try {
      if (!isSoundMuted) playKitchenChime();
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus, hotelId: currentHotelId }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Complete request
  const handleCompleteRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus: 'completed', hotelId: currentHotelId, actorName: 'Housekeeping Team' }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error completing request:', err);
    }
  };

  // Acknowledge request (On it)
  const handleAcknowledgeRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus: 'acknowledged', hotelId: currentHotelId, actorName: 'Housekeeping Lead' }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error acknowledging request:', err);
    }
  };

  // Simulate Housekeeping Request
  const handleSimulateRequest = async () => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayToken: 'rb_token_hotel-001_room-103_3040',
          category: 'housekeeping',
          title: 'Extra Plush Bath Towels & Aromatherapy Kit',
          details: 'Please deliver 2 extra bath sheets and lavender diffuser.',
          priority: 'high',
          slaMinutes: 15,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error simulating request:', err);
    }
  };

  // Check-In
  const handleCheckInGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForCheckIn || !guestNameInput.trim()) return;

    setIsSubmittingCheckIn(true);
    try {
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + checkOutDaysInput);

      const generatedPin = customPinInput.trim() || Math.floor(1000 + Math.random() * 9000).toString();

      const res = await fetch('/api/stays/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: currentHotelId,
          roomId: selectedRoomForCheckIn.id,
          guestName: guestNameInput.trim(),
          customPin: generatedPin,
          checkOutDate: checkOutDate.toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCheckInSuccessBanner({
          room: selectedRoomForCheckIn.room_number,
          pin: data.checkinPin || generatedPin,
          guest: guestNameInput.trim(),
        });
        setIsCheckInModalOpen(false);
        setGuestNameInput('');
        setCustomPinInput('');
        setSelectedRoomForCheckIn(null);
        await refreshData();
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Check-Out
  const handleCheckOutGuest = async (roomId: string) => {
    if (!confirm('Check out guest and release room for housekeeping?')) return;
    try {
      const res = await fetch('/api/stays/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, hotelId: currentHotelId }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Check-out error:', err);
    }
  };

  // Simulate Order (Creates live persistent order & triggers kitchen chime)
  const handleSimulateOrder = async () => {
    try {
      if (!isSoundMuted) playKitchenChime();
      const availableRooms = roomsList.filter((r) => r.activeStay);
      const targetRoom = availableRooms.length > 0 ? availableRooms[0] : roomsList[0];
      const roomNum = targetRoom ? targetRoom.room_number : 'Room 101';

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulate: true,
          hotelId: currentHotelId,
          roomNumber: roomNum,
        }),
      });

      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error simulating ticket:', err);
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return roomsList;
    const query = searchQuery.toLowerCase();
    return roomsList.filter(
      (r) =>
        r.room_number.toLowerCase().includes(query) ||
        r.room_type.toLowerCase().includes(query) ||
        r.activeStay?.guestName.toLowerCase().includes(query) ||
        r.activeStay?.checkinPin.includes(query)
    );
  }, [roomsList, searchQuery]);

  const navMenuItems = [
    { id: 'overview', label: 'Executive Overview', icon: SlidersHorizontal },
    { id: 'kds', label: 'Kitchen Workspace', icon: Utensils, badge: activeOrdersCount },
    { id: 'desk', label: 'Front Desk & Rooms', icon: ConciergeBell, badge: requests.filter((r) => r.status !== 'completed').length },
    { id: 'standees', label: 'Rooms & Bedside QRs', icon: QrCode },
    { id: 'housekeeping', label: 'Housekeeping Matrix', icon: BedDouble },
    { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#080c14] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col md:flex-row font-sans transition-colors duration-200`}>
      {/* ==================== 1. LEFT SIDEBAR NAVIGATION ==================== */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-[#0a0f1c] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top: Logo & Hotel Info */}
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-sm shadow-md ring-1 ring-amber-400/50">
                  RB
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    ResortBrain
                  </span>
                  <span className="block text-[10px] text-amber-400 font-semibold uppercase tracking-wider -mt-0.5">
                    Operations PMS
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hotel Selector in Sidebar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-semibold">
                <Building className="w-3 h-3 text-amber-400" />
                <span>Active Hotel Tenant</span>
              </div>
              <select
                value={currentHotelId}
                onChange={(e) => setCurrentHotelId(e.target.value)}
                className="w-full bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer truncate"
              >
                {hotelsList.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-200">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
              Workspaces
            </div>
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        isActive ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
                Guest Experience
              </div>
              <Link
                href={`/h/${currentHotel.slug}`}
                target="_blank"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Live Guest PWA Sim</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Mobile
                </span>
              </Link>
            </div>
          </nav>

          {/* Sidebar Bottom: Status & User */}
          <div className="p-3 border-t border-slate-800/80 space-y-3 bg-[#080d18]">
            {/* Live Connection Pill */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400 font-mono">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Realtime Live</span>
              </div>
              <button
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="text-slate-400 hover:text-white"
                title={isSoundMuted ? 'Sound Muted' : 'Sound Chimes On'}
              >
                {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-white truncate max-w-[110px]">Marcus Vance</div>
                  <div className="text-[10px] text-slate-400">General Manager</div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            </div>

            {/* Exit link */}
            <Link
              href="/"
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit to Website</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ==================== 2. MAIN WORKSPACE AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Top Workspace Header */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                {activeTab === 'overview' && 'Executive Management Suite'}
                {activeTab === 'kds' && 'Kitchen Display System (KDS Kanban)'}
                {activeTab === 'desk' && 'Front Desk, Rooms & Dynamic PINs'}
                {activeTab === 'standees' && 'Bedside Luxury QR Standee Generator'}
                {activeTab === 'housekeeping' && 'Housekeeping Matrix & Service Queue'}
                {activeTab === 'audit' && 'Security & Immutable Audit Trail'}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Live for <strong className="text-slate-200">{currentHotel.name}</strong> • Realtime operations
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Check-In CTA Button */}
            <button
              onClick={() => {
                const available = roomsList.find((r) => r.status === 'available');
                setSelectedRoomForCheckIn(available || roomsList[0]);
                setIsCheckInModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check-In Guest</span>
            </button>

            {/* Simulate Order Button */}
            <button
              onClick={handleSimulateOrder}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-semibold text-xs transition-colors cursor-pointer"
              title="Simulate incoming order with chime"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Simulate Ticket</span>
            </button>

            {/* Refresh */}
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Success Check-In Notification Banner */}
        {checkInSuccessBanner && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 sm:px-8 py-2.5 text-xs text-emerald-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Check-In Successful!</strong> {checkInSuccessBanner.guest} checked into{' '}
                <strong>{checkInSuccessBanner.room}</strong>. Dynamic Security PIN:{' '}
                <span className="font-mono font-extrabold text-sm text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                  {checkInSuccessBanner.pin}
                </span>
              </span>
            </div>
            <button
              onClick={() => setCheckInSuccessBanner(null)}
              className="text-emerald-400 hover:text-white p-1 rounded hover:bg-emerald-900/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ===================== TAB 1: EXECUTIVE OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 4 Core Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Today's Revenue */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Total Revenue (Today)</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      +18.2% <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold mt-2 text-amber-400 font-mono">
                    ₹{(totalRevenuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {orders.length} in-room dining orders processed
                  </div>
                </div>

                {/* KPI 2: Active Kitchen Orders */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Active Kitchen Tickets</span>
                    <span className="text-amber-400 font-semibold">Realtime Rail</span>
                  </div>
                  <div className="text-2xl font-extrabold mt-2 text-white font-mono flex items-center gap-2">
                    <span>{activeOrdersCount} Active</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Avg prep time: <strong className="text-slate-200">11.4 mins</strong>
                  </div>
                </div>

                {/* KPI 3: SLA Adherence */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>SLA Adherence Rate</span>
                    <span className="text-emerald-400 font-semibold font-mono">98.6%</span>
                  </div>
                  <div className="text-2xl font-extrabold mt-2 text-emerald-400 font-mono">
                    98.6%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    1 escalation resolved today
                  </div>
                </div>

                {/* KPI 4: Room Occupancy */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0e1424] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Occupancy Rate</span>
                    <span className="text-emerald-400 font-semibold font-mono">{occupancyRate}%</span>
                  </div>
                  <div className="text-2xl font-extrabold mt-2 text-white font-mono flex items-center gap-2">
                    <span>{occupiedRoomsCount} / {roomsList.length || 15}</span>
                    <span className="text-xs font-normal text-slate-400 font-sans">rooms</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    High season volume active
                  </div>
                </div>
              </div>

              {/* Dynamic Check-In Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Dynamic 4-Digit PIN Security Architecture</h3>
                    <p className="text-xs text-slate-400">
                      Every guest check-in generates an isolated cryptographic stay token with 4-digit PIN verification on scan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const available = roomsList.find((r) => r.status === 'available');
                    setSelectedRoomForCheckIn(available || roomsList[0]);
                    setIsCheckInModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/30 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Check-In Guest (Generate PIN)</span>
                </button>
              </div>

              {/* 2-Column Split: Orders Pipeline + Rooms & Active PINs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Live Order Pipeline */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-sm text-white">Live Order Pipeline</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {orders.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('kds')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full KDS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => {
                      const roomLabel = order.room_number || 'Room 101';
                      const roomBadge = roomLabel.replace('Room ', '').replace('Suite ', 'S');

                      return (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-slate-800 bg-[#0e1424] hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs font-mono">
                                {roomBadge}
                              </span>
                              <div>
                                <div className="font-bold text-white text-xs">
                                  {order.order_number} • {roomLabel}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {(order.items || []).map((i) => `${i.quantity || 1}x ${i.itemName || i.name || 'Dish'}`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-xs text-white">
                                ₹{(order.total_paise / 100).toFixed(2)}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mt-0.5 ${
                                  order.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                                    : order.status === 'accepted' || order.status === 'preparing'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                    : order.status === 'ready'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {order.special_instructions && (
                            <div className="p-2 rounded bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300/90 italic">
                              "{order.special_instructions}"
                            </div>
                          )}

                          {/* Quick 1-Click Action */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                Accept Order
                              </button>
                            )}
                            {(order.status === 'accepted' || order.status === 'preparing') && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                Mark Ready
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                Complete Delivery
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {orders.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        No active orders. Click "Simulate Ticket" to test live KDS workflow.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Rooms & Active Dynamic PINs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-sm text-white">Rooms & Active Dynamic PINs</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {roomsList.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('desk')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Rooms</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {roomsList.slice(0, 5).map((room) => {
                      const isOccupied = room.status === 'occupied' || room.activeStay !== null;
                      const roomBadge = (room.room_number || '304').replace('Room ', '').replace('Suite ', 'S');

                      return (
                        <div
                          key={room.id}
                          className="p-3.5 rounded-xl border border-slate-800 bg-[#0e1424] hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isOccupied
                                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {roomBadge}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{room.room_number}</span>
                                <span className="text-[10px] text-slate-400">({room.room_type})</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {isOccupied ? (
                                  <span>
                                    Guest: <strong className="text-slate-200">{room.activeStay?.guestName || 'VIP Guest'}</strong>
                                  </span>
                                ) : (
                                  <span className="text-emerald-400">Available for check-in</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Dynamic PIN Display & Actions */}
                          <div className="flex items-center gap-3">
                            {isOccupied && room.activeStay?.checkinPin && (
                              <div className="text-right">
                                <div className="text-[9px] text-slate-400 uppercase font-semibold">Stay PIN</div>
                                <div className="font-mono font-extrabold text-sm text-amber-400 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded">
                                  {room.activeStay.checkinPin}
                                </div>
                              </div>
                            )}

                            {isOccupied ? (
                              <button
                                onClick={() => handleCheckOutGuest(room.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 transition-colors cursor-pointer"
                              >
                                Check Out
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedRoomForCheckIn(room);
                                  setIsCheckInModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                              >
                                Check In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: KITCHEN WORKSPACE (KDS) ===================== */}
          {activeTab === 'kds' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-400" />
                    <span>Kitchen Display System (KDS Kanban)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time ticket rail. Live orders chime automatically when placed by guests.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateOrder}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simulate Ticket</span>
                  </button>
                </div>
              </div>

              {/* 3-Column Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Pending */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="font-bold text-xs text-amber-300 uppercase">1. New Incoming</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {pendingOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pendingOrders
                      .map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-amber-500/40 bg-[#0e1424] space-y-3 shadow-md shadow-amber-950/20"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-amber-400">{order.order_number}</span>
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              {order.room_number || 'Room 304'}
                            </span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300">
                                <span>
                                  <strong className="text-amber-300">{item.quantity}x</strong>{' '}
                                  {item.itemName || item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                          {order.special_instructions && (
                            <div className="p-2 rounded bg-amber-950/40 border border-amber-900/50 text-[11px] text-amber-200">
                              {order.special_instructions}
                            </div>
                          )}
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow cursor-pointer"
                          >
                            Accept Order (Start Prep)
                          </button>
                        </div>
                      ))}
                    {pendingOrders.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        No pending tickets
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: In Preparation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                      <span className="font-bold text-xs text-blue-300 uppercase">2. Cooking Line</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-300">
                      {preparingOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {preparingOrders
                      .map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-blue-500/30 bg-[#0e1424] space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-blue-400">{order.order_number}</span>
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              {order.room_number || 'Room 304'}
                            </span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300">
                                <span>
                                  <strong className="text-white">{item.quantity}x</strong>{' '}
                                  {item.itemName || item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow cursor-pointer"
                          >
                            Mark Ready for Delivery
                          </button>
                        </div>
                      ))}
                    {preparingOrders.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        No orders on cooking line
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Ready for Delivery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span className="font-bold text-xs text-emerald-300 uppercase">3. Ready for Runner</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {readyOrders.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {readyOrders
                      .map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl border border-emerald-500/40 bg-[#0e1424] space-y-3 shadow-md shadow-emerald-950/20"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-emerald-400">{order.order_number}</span>
                            <span className="font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                              {order.room_number || 'Room 304'}
                            </span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-slate-300">
                                <span>
                                  <strong className="text-white">{item.quantity}x</strong>{' '}
                                  {item.itemName || item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow cursor-pointer"
                          >
                            Complete Delivery
                          </button>
                        </div>
                      ))}
                    {readyOrders.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                        No orders awaiting runner
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: FRONT DESK & ROOMS ===================== */}
          {activeTab === 'desk' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ConciergeBell className="w-5 h-5 text-amber-400" />
                    <span>Front Desk, Room Inventory & Stay PINs</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Every check-in creates an active stay with a dynamic 4-digit PIN for in-room guest auth.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search room or guest..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-64"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const available = roomsList.find((r) => r.status === 'available');
                      setSelectedRoomForCheckIn(available || roomsList[0]);
                      setIsCheckInModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Check-In</span>
                  </button>
                </div>
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const isOccupied = room.status === 'occupied' || room.activeStay !== null;

                  return (
                    <div
                      key={room.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        isOccupied
                          ? 'border-amber-500/30 bg-[#0e1424] shadow-sm'
                          : 'border-slate-800 bg-[#0b101c]/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">{room.room_number}</span>
                          <span className="text-xs text-slate-400">({room.room_type})</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOccupied
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </div>

                      {isOccupied && room.activeStay ? (
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Guest:</span>
                            <strong className="text-white">{room.activeStay.guestName}</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Dynamic PIN:</span>
                            <span className="font-mono font-extrabold text-sm text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                              {room.activeStay.checkinPin}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                            <span>Check Out:</span>
                            <span>{new Date(room.activeStay.checkOut).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                          Room vacant. Ready for next guest arrival.
                        </div>
                      )}

                      {/* Room actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setSelectedStandeeRoom(room);
                            setActiveTab('standees');
                          }}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Print Standee</span>
                        </button>

                        {isOccupied ? (
                          <button
                            onClick={() => handleCheckOutGuest(room.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 transition-colors cursor-pointer"
                          >
                            Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedRoomForCheckIn(room);
                              setIsCheckInModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 font-bold transition-colors cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: BEDSIDE QR STANDEES ===================== */}
          {activeTab === 'standees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <span>Bedside Luxury QR Standee Generator</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Print high-res acrylic bedside standees for every guest room. Encodes direct mobile link with dynamic PIN verification.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee Card</span>
                </button>
              </div>

              {/* Room Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {roomsList.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedStandeeRoom(room)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      selectedStandeeRoom?.id === room.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {room.room_number}
                  </button>
                ))}
              </div>

              {/* Standee Preview Card */}
              {selectedStandeeRoom && (
                <div className="max-w-md mx-auto p-8 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-[#0f172a] to-[#070b14] text-center shadow-2xl shadow-amber-950/30 space-y-6 relative overflow-hidden print:border-black print:text-black print:bg-white print:shadow-none">
                  {/* Brand Header */}
                  <div className="space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-lg text-white tracking-wide uppercase">
                      {currentHotel.name}
                    </h3>
                    <p className="text-xs text-amber-400 font-medium">In-Room Luxury Concierge & Dining</p>
                  </div>

                  {/* Room Number Badge */}
                  <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-white font-bold text-sm">
                    {selectedStandeeRoom.room_number} • {selectedStandeeRoom.room_type}
                  </div>

                  {/* QR Code Display */}
                  <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto">
                    {qrCodeDataUrls[selectedStandeeRoom.id] ? (
                      <img
                        src={qrCodeDataUrls[selectedStandeeRoom.id]}
                        alt={`QR Code for ${selectedStandeeRoom.room_number}`}
                        className="w-48 h-48 mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="text-xs text-slate-300 space-y-2">
                    <div className="font-semibold text-white">How to Access 24/7 Room Service:</div>
                    <ol className="text-left text-slate-400 text-[11px] space-y-1 list-decimal list-inside bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <li>Open your smartphone camera & scan the QR code above.</li>
                      <li>
                        Enter your 4-digit stay PIN:{' '}
                        <strong className="text-amber-400 font-mono">
                          {selectedStandeeRoom.activeStay?.checkinPin || 'Generated upon check-in'}
                        </strong>
                      </li>
                      <li>Order gourmet dining, request housekeeping, or view live folio billing.</li>
                    </ol>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Powered by ResortBrain Luxury PMS • Token: {selectedStandeeRoom.qr_code_token}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 5: HOUSEKEEPING ===================== */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-amber-400" />
                    <span>Housekeeping & Service Requests</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live guest requests from in-room PWA for towels, housekeeping, turndown, and amenities.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateRequest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simulate Request</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border bg-[#0e1424] flex flex-col justify-between gap-3 ${
                      req.status === 'created'
                        ? 'border-amber-500/40 shadow-sm shadow-amber-950/20'
                        : req.status === 'acknowledged'
                        ? 'border-blue-500/40'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                          {req.room_number || 'Room 304'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-semibold text-amber-400 capitalize">{req.category}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'acknowledged'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {req.status === 'acknowledged' ? 'On It / In Progress' : req.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{req.title}</h4>
                      {req.details && <p className="text-xs text-slate-400 mt-1">{req.details}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(req.created_at).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {req.status === 'created' && (
                          <button
                            onClick={() => handleAcknowledgeRequest(req.id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Accept / On It
                          </button>
                        )}
                        {req.status !== 'completed' && (
                          <button
                            onClick={() => handleCompleteRequest(req.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="col-span-2 p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                    No open service requests at this time. Click &quot;Simulate Request&quot; to test.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 6: SECURITY & AUDIT ===================== */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Security & Real-time Audit Trail</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Immutable audit records of PIN verifications, stay check-ins, order placements, and room clearances.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0e1424] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Actor</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Resource</th>
                      <th className="p-3.5">Trace ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </td>
                        <td className="p-3.5 font-semibold text-white">{log.actor_role}</td>
                        <td className="p-3.5">
                          <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono text-[11px]">{log.target_resource}</td>
                        <td className="p-3.5 font-mono text-[10px] text-slate-500">{log.trace_id}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                          No security logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== CHECK-IN MODAL ===================== */}
      {isCheckInModalOpen && selectedRoomForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1424] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Check In Guest</h3>
              </div>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckInGuest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Room Assignment</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold">
                  {selectedRoomForCheckIn.room_number} ({selectedRoomForCheckIn.room_type})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="e.g. Vikram Oberoi"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stay Duration (Nights)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={checkOutDaysInput}
                  onChange={(e) => setCheckOutDaysInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Dynamic 4-Digit Stay PIN (Optional Custom)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={customPinInput}
                  onChange={(e) => setCustomPinInput(e.target.value)}
                  placeholder="Leave blank for auto-generated 4-digit PIN"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This PIN is required when scanning the bedside QR code to place room service orders.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isSubmittingCheckIn ? 'Activating Stay...' : 'Confirm Check-In & Generate PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
