'use client';

// app/guest/page.tsx
// Standalone Mobile Guest Concierge PWA for Resort Guests
// Dynamic Multi-Hotel support, Live Order Tracking, Room Service, Butler Requests & Folio Settle

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ConciergeBell,
  Receipt,
  Sun,
  Moon,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  KeyRound,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price_paise: number;
  image_url: string;
  is_veg: boolean;
}

interface Order {
  id: string;
  hotel_id: string;
  room_number: string;
  order_number: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered';
  items: Array<{
    itemName: string;
    quantity: number;
    totalPricePaise: number;
  }>;
  total_paise: number;
  created_at: string;
}

interface HotelOption {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  currency?: string;
  activeStay: {
    stayId: string;
    roomNumber: string;
    guestName: string;
    stayToken: string;
  };
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  subtotal_paise: number;
  tax_paise: number;
  service_charge_paise: number;
  total_paise: number;
  status: 'draft' | 'issued' | 'paid';
}

export default function GuestPWAView() {
  const [isDark, setIsDark] = useState(true);

  // Dynamic Hotels List & Selected Hotel
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState('hotel-001');

  // Hotel & Room Stay Info
  const [hotelTitle, setHotelTitle] = useState('Grand Azure Resort & Spa');
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [roomType, setRoomType] = useState('Oceanfront Pool Villa');
  const [guestName, setGuestName] = useState('Valued Guest');
  const [currentStayToken, setCurrentStayToken] = useState('');

  // Bedside QR & Dynamic Security PIN States
  const [isVerified, setIsVerified] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [roomPinHint, setRoomPinHint] = useState('');
  const [roomsList, setRoomsList] = useState<any[]>([]);

  // Menu & Cart
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active Orders & Modals
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'housekeeping' | 'amenities' | 'front_desk'>('housekeeping');
  const [requestTitle, setRequestTitle] = useState('Extra Plush Bath Towels & Lavender Diffuser');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Folio Billing State
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [billSettled, setBillSettled] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load URL parameters (e.g. ?room=Room%20101&hotel=grand-azure&qr=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const hotelSlugParam = urlParams.get('hotel');
    const qrParam = urlParams.get('qr');

    const initStayFromUrl = async () => {
      try {
        const hotelRes = await fetch('/api/hotels');
        const hotelsData = await hotelRes.json();
        let targetHotelId = selectedHotelId;

        if (hotelsData.hotels && hotelsData.hotels.length > 0) {
          setHotels(hotelsData.hotels);
          if (hotelSlugParam) {
            const h = hotelsData.hotels.find((item: any) => item.slug === hotelSlugParam || item.id === hotelSlugParam);
            if (h) targetHotelId = h.id;
          }
          setSelectedHotelId(targetHotelId);
          const hotelObj = hotelsData.hotels.find((h: any) => h.id === targetHotelId);
          if (hotelObj) setHotelTitle(hotelObj.name);
        }

        const roomsRes = await fetch(`/api/rooms?hotelId=${targetHotelId}`);
        const roomsData = await roomsRes.json();
        if (roomsData.rooms && roomsData.rooms.length > 0) {
          setRoomsList(roomsData.rooms);

          let targetRoom = null;
          if (roomParam) {
            const cleanParam = roomParam.toLowerCase().replace(/^(room|villa|suite)\s*/i, '').trim();
            targetRoom = roomsData.rooms.find((r: any) => {
              const rClean = r.room_number.toLowerCase().replace(/^(room|villa|suite)\s*/i, '').trim();
              return rClean === cleanParam || r.room_number.toLowerCase() === roomParam.toLowerCase();
            });
          } else if (qrParam) {
            targetRoom = roomsData.rooms.find((r: any) => r.qr_code_token === qrParam);
          }

          if (!targetRoom) {
            targetRoom = roomsData.rooms[0];
          }

          if (targetRoom) {
            setRoomNumber(targetRoom.room_number);
            setRoomType(targetRoom.room_type);
            if (targetRoom.activeStay) {
              setGuestName(targetRoom.activeStay.guestName);
              setRoomPinHint(targetRoom.activeStay.checkinPin);

              // Check if already authenticated for this room
              const cached = sessionStorage.getItem(`rb_stay_verified_${targetRoom.id}`);
              if (cached) {
                setCurrentStayToken(targetRoom.activeStay.stayToken);
                setIsVerified(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to init guest view:', err);
      }
    };

    initStayFromUrl();
  }, []);

  // Sync menu and orders whenever selectedHotelId or isVerified changes
  useEffect(() => {
    if (isVerified) {
      loadGuestData(selectedHotelId);
    }
  }, [selectedHotelId, isVerified]);

  // Real-time automatic background polling every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetch(`/api/orders?hotelId=${selectedHotelId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.orders) {
            setActiveOrders((prevOrders) => {
              const prev = prevOrders[0];
              const next = data.orders[0];
              // If status changed on the active order, play audio chime!
              if (prev && next && prev.id === next.id && prev.status !== next.status) {
                playKitchenChime();
              }
              return data.orders;
            });
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedHotelId]);

  // Load Menu & Orders
  const loadGuestData = async (hotelId = selectedHotelId) => {
    try {
      const menuRes = await fetch(`/api/menu?hotelId=${hotelId}`);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.items || []);
      }

      const orderRes = await fetch(`/api/orders?hotelId=${hotelId}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        setActiveOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load guest data:', err);
    }
  };

  // Bedside Security PIN Verification Handler
  const handleVerifyPin = async (e?: React.FormEvent, pinOverride?: string) => {
    if (e) e.preventDefault();
    const pin = pinOverride || enteredPin;
    if (!pin || pin.length < 4) {
      setPinError('Please enter your 4-digit Stay PIN.');
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch('/api/stays/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          roomNumber,
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'Incorrect 4-digit PIN for this room.');
        setPinLoading(false);
        return;
      }

      if (data.session) {
        setCurrentStayToken(data.session.stayToken);
        setGuestName(data.session.guestName);
        setRoomNumber(data.session.roomNumber);
        setHotelTitle(data.session.hotelName);
        setIsVerified(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`rb_stay_verified_${data.session.roomId}`, 'true');
        }
        await loadGuestData(data.session.hotelId);
      }
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : 'Error verifying check-in PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // Switch or Lock Room
  const handleLockRoom = () => {
    setIsVerified(false);
    setEnteredPin('');
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  };

  // Cart Functions
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

  // Synthesize Bell Chime audio
  const playKitchenChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (cartItemsCount === 0) return;

    const payload = {
      stayToken: currentStayToken,
      items: Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      specialInstructions: specialInstructions || undefined,
      idempotencyKey: `ord_${Date.now()}`,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCart({});
        setSpecialInstructions('');
        setIsCartOpen(false);
        playKitchenChime();
        await loadGuestData(selectedHotelId);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  // Submit Service Request
  const handleSendRequest = async () => {
    const payload = {
      stayToken: currentStayToken,
      category: requestCategory,
      title: requestTitle,
      details: 'Guest requested prompt service via mobile concierge.',
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
        setRequestSuccess(true);
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setRequestSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  // Load Folio Bill
  const openFolioModal = async () => {
    setIsBillOpen(true);
    try {
      const res = await fetch(`/api/billing?stayToken=${encodeURIComponent(currentStayToken)}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setBillSettled(data.invoice?.status === 'paid');
      }
    } catch (err) {
      console.error('Failed to load bill:', err);
    }
  };

  // Pay & Settle Folio
  const handlePayInvoice = async () => {
    if (!invoice) return;
    setIsPaying(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayToken: currentStayToken,
          invoiceId: invoice.id,
          amountPaise: invoice.total_paise,
          idempotencyKey: `pay_${Date.now()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setBillSettled(true);
      }
    } catch (err) {
      console.error('Failed to settle bill:', err);
    } finally {
      setIsPaying(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    return true;
  });

  const handleSelectRoom = (r: any) => {
    setRoomNumber(r.room_number);
    setRoomType(r.room_type || 'Villa');
    setPinError(null);
    setEnteredPin('');
    if (r.activeStay) {
      setGuestName(r.activeStay.guestName);
      setRoomPinHint(r.activeStay.checkinPin || '');
    } else {
      setGuestName('Vacant Room');
      setRoomPinHint('');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Mobile PWA Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md bg-white/90 dark:bg-[#0f172a]/95 border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to SaaS Website</span>
          </Link>

          {/* Dynamic Hotel & Room Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedHotelId}
              onChange={(e) => {
                setSelectedHotelId(e.target.value);
                setIsVerified(false);
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:ring-1 focus:ring-amber-500 max-w-[200px] truncate"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {isVerified && (
              <button
                onClick={handleLockRoom}
                title="Lock Room Concierge"
                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all"
              >
                Lock
              </button>
            )}

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Conditional: If NOT verified, show Bedside QR Security Verification Gate */}
      {!isVerified ? (
        <main className="max-w-md mx-auto px-4 py-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner shadow-amber-500/20">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Bedside QR Security
              </span>
              <h1 className="text-2xl font-black tracking-tight mt-2 text-slate-900 dark:text-white">
                {hotelTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Scanned QR on Standee • {roomNumber} ({roomType})
              </p>
            </div>
          </div>

          {/* Room Selector if user is testing different rooms */}
          {roomsList.length > 0 && (
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>Select Scanned Room:</span>
                <span className="text-[10px] text-amber-500 font-semibold">{roomsList.length} Rooms</span>
              </label>
              <select
                value={roomNumber}
                onChange={(e) => {
                  const r = roomsList.find((rm: any) => rm.room_number === e.target.value);
                  if (r) handleSelectRoom(r);
                }}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {roomsList.map((rm: any) => (
                  <option key={rm.id} value={rm.room_number}>
                    {rm.room_number} - {rm.room_type} ({rm.status === 'occupied' ? `Occupied: ${rm.activeStay?.guestName}` : 'Vacant'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Verification Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Enter 4-Digit Stay PIN
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To prevent unauthorized dining orders and folio charges, please enter your check-in PIN given at the front desk.
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold text-center">
                {pinError}
              </div>
            )}

            <form onSubmit={(e) => handleVerifyPin(e)} className="space-y-4">
              <div className="flex justify-center">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  placeholder="••••"
                  value={enteredPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEnteredPin(val);
                    if (val.length === 4) {
                      handleVerifyPin(undefined, val);
                    }
                  }}
                  className="w-44 text-center tracking-[0.5em] text-2xl font-black py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-amber-500/50 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading || enteredPin.length !== 4}
                className="w-full py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {pinLoading ? 'Verifying Stay...' : 'Unlock In-Room Concierge'}
              </button>
            </form>

            {/* Demo Helper Pill */}
            {roomPinHint ? (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
                <p className="text-[11px] text-slate-400">
                  Guest on file: <strong className="text-slate-200">{guestName}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin(roomPinHint);
                    handleVerifyPin(undefined, roomPinHint);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>⚡ 1-Click Demo Fill: Unlock with PIN <strong>{roomPinHint}</strong></span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[11px] text-amber-500 font-semibold">
                  ⚠️ This room is currently vacant. Please check in a guest first from the dashboard.
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Powered by ResortBrain Bedside Token Security • SOC2 & ISO 27001 Compliant
          </div>
        </main>
      ) : (
        <>
          {/* Main Guest Mobile Container (Max Width 640px for Real Phone Feel) */}
          <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">
          {/* Luxury Hero Guest Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 p-6 text-white shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> {roomNumber} • PIN Verified
                </span>
                <button
                  onClick={handleLockRoom}
                  className="text-[11px] text-slate-400 hover:text-rose-400 font-medium underline underline-offset-2"
                >
                  Exit / Lock
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{hotelTitle}</h1>
              <p className="text-xs text-slate-300 mt-1">Guest: {guestName}</p>

              {/* Quick Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 backdrop-blur-md transition-all shadow"
                >
                  <ConciergeBell className="w-4 h-4 text-amber-400" />
                  <span>Butler & Amenities</span>
                </button>

                <button
                  onClick={openFolioModal}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-105 text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Room Folio</span>
                </button>
              </div>
            </div>
          </div>

        {/* Live Order Tracker (If Orders Exist) */}
        {activeOrders.length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-500">
                <Clock className="w-4 h-4" /> Order {activeOrders[0].order_number} Tracking
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {activeOrders[0].status}
              </span>
            </div>

            {/* 5-Step Visual Progress Bar */}
            <div className="grid grid-cols-5 gap-1 pt-2">
              {[
                { key: 'pending', label: 'Placed', step: 1 },
                { key: 'accepted', label: 'Accepted', step: 2 },
                { key: 'preparing', label: 'Cooking', step: 3 },
                { key: 'ready', label: 'Runner', step: 4 },
                { key: 'delivered', label: 'Delivered', step: 5 },
              ].map((s) => {
                const orderSteps: Record<string, number> = {
                  pending: 1,
                  accepted: 2,
                  preparing: 3,
                  ready: 4,
                  delivered: 5,
                };
                const currentStep = orderSteps[activeOrders[0].status] || 1;
                const isPassed = s.step <= currentStep;
                const isCurrent = s.step === currentStep;

                return (
                  <div key={s.key} className="flex flex-col items-center gap-1 text-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-md'
                          : isPassed
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed && !isCurrent ? '✓' : s.step}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isCurrent ? 'text-amber-500' : isPassed ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Header: In-Room Gourmet Dining */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black tracking-tight">In-Room Gourmet Dining</h2>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>🌿 Pure Veg</span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const inCartCount = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                          item.is_veg
                            ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10'
                            : 'text-rose-500 border-rose-500/40 bg-rose-500/10'
                        }`}
                      >
                        {item.is_veg ? 'VEG' : 'NON-VEG'}
                      </span>
                      <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white">{item.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                    <p className="font-extrabold text-xs text-amber-500 mt-1">
                      ₹{(item.price_paise / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Cart Action Buttons */}
                <div className="shrink-0">
                  {inCartCount === 0 ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm border border-slate-200 dark:border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2 py-1">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-amber-500 font-black hover:scale-110"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs text-amber-500 min-w-4 text-center">{inCartCount}</span>
                      <button onClick={() => addToCart(item.id)} className="text-amber-500 font-black hover:scale-110">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating View Cart Sticky Bottom Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 max-w-2xl mx-auto px-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center font-black text-xs">
                {cartItemsCount}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-900/80">Room Order Cart</p>
                <p className="font-black text-sm">₹{(cartTotalPaise / 100).toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-950 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow hover:brightness-110 transition-all"
            >
              <span>Review Order</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Review Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                Review Your Cart
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ₹{(item.price_paise / 100).toFixed(2)} × {qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-500">
                        ₹{((item.price_paise * qty) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Chef Instructions */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Special Instructions for Chef / Runner</label>
              <input
                type="text"
                placeholder="E.g. Less spicy, extra cutlery, ring bell twice"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Server-Authoritative Totals Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  ₹{(cartTotalPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  ₹{((cartTotalPaise * 0.18) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service Charge (5%):</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  ₹{((cartTotalPaise * 0.05) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 dark:border-slate-700 text-amber-500">
                <span>Grand Total:</span>
                <span>₹{((cartTotalPaise * 1.23) / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Order */}
            <button
              onClick={handlePlaceOrder}
              className="w-full py-3.5 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Place In-Room Order (To {roomNumber})
            </button>
          </div>
        </div>
      )}

      {/* Butler & Amenities Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-lg flex items-center gap-2">
                <ConciergeBell className="w-5 h-5 text-amber-500" />
                Butler & Room Service
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            {requestSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-black text-base">Request Dispatched!</h4>
                <p className="text-xs text-slate-400">A dedicated team member has been notified.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-400 block mb-1.5">Department Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'housekeeping', label: 'Housekeeping' },
                      { key: 'amenities', label: 'Amenities' },
                      { key: 'front_desk', label: 'Front Desk' },
                    ].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setRequestCategory(c.key as any)}
                        className={`py-2 rounded-xl font-bold border transition-all ${
                          requestCategory === c.key
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-400 block mb-1.5">Request Details</label>
                  <input
                    type="text"
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder="E.g. Extra pillows, AC check, bottle of water"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <button
                  onClick={handleSendRequest}
                  className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow hover:brightness-105 transition-all"
                >
                  Send Request to Housekeeping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Room Folio Bill & Settle Modal */}
      {isBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Live Room Folio & Invoice
              </h3>
              <button onClick={() => setIsBillOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Invoice: {invoice?.invoice_number || 'INV-2026-LIVE'}</span>
                <span className="font-bold text-amber-500 uppercase">{invoice?.status || 'Draft'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Room Dining & Amenities:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{(((invoice?.subtotal_paise || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18%):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{(((invoice?.tax_paise || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Service Charge (5%):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{(((invoice?.service_charge_paise || 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 dark:border-slate-700 text-amber-500">
                  <span>Total Amount Due:</span>
                  <span>₹{(((invoice?.total_paise || 0)) / 100).toFixed(2)}</span>
                </div>
              </div>

              {billSettled ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <div className="text-emerald-500 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Paid & Settled in Test Mode
                  </div>
                  <p className="text-[10px] text-slate-400">Zero balance due. Receipt recorded on folio ledger.</p>
                </div>
              ) : (
                <button
                  disabled={isPaying || !invoice || invoice.total_paise === 0}
                  onClick={handlePayInvoice}
                  className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 text-slate-950 shadow hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPaying ? 'Processing Settlement...' : 'Pay & Settle (Test Mode)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
