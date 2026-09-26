'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  ConciergeBell,
  Receipt,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Building,
  KeyRound,
  Printer,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
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

export default function GuestPWAView() {
  const [isDark, setIsDark] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState('hotel-001');

  // Hotel Info
  const [hotelTitle, setHotelTitle] = useState('Grand Azure Resort & Spa');
  const [roomNumber, setRoomNumber] = useState('Room 304');
  const [guestName, setGuestName] = useState('Dr. Siddharth Verma');

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

  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billSettled, setBillSettled] = useState(false);

  // Sync dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load Data
  const loadGuestData = async () => {
    try {
      const menuRes = await fetch(`/api/menu?hotelId=${selectedHotelId}`);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data.items || []);
      }

      const orderRes = await fetch(`/api/orders?hotelId=${selectedHotelId}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        setActiveOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load guest data:', err);
    }
  };

  useEffect(() => {
    if (selectedHotelId === 'hotel-001') {
      setHotelTitle('Grand Azure Resort & Spa');
      setRoomNumber('Room 304');
      setGuestName('Dr. Siddharth Verma');
    } else {
      setHotelTitle('The Leela Palace Resort & Spa');
      setRoomNumber('Villa 101');
      setGuestName('Nihal Kumar');
    }
    loadGuestData();
  }, [selectedHotelId]);

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

  // Place Order
  const handlePlaceOrder = async () => {
    if (cartItemsCount === 0) return;

    const payload = {
      stayToken: selectedHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : 'token_the-leela-palace_room_101',
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
        await loadGuestData();
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  // Submit Service Request
  const handleSendRequest = async () => {
    const payload = {
      stayToken: selectedHotelId === 'hotel-001' ? 'stay_token_live_demo_room_304' : 'token_the-leela-palace_room_101',
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

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    return true;
  });

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

          {/* Hotel & Room Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:ring-1 focus:ring-amber-500"
            >
              <option value="hotel-001">Grand Azure (Room 304)</option>
              <option value="the-leela-palace">The Leela Palace (Villa 101)</option>
            </select>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Guest Mobile Container (Max Width 640px for Real Phone Feel) */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">
        {/* Luxury Hero Guest Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 p-6 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-wider border border-amber-500/30">
                <KeyRound className="w-3.5 h-3.5" /> {roomNumber} • Active Stay
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Digital Concierge</span>
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
                onClick={() => setIsBillOpen(true)}
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
              <span className="px-2.5 py-0.5 rounded-full font-black uppercase bg-amber-500/10 text-amber-500">
                {activeOrders[0].status}
              </span>
            </div>

            {/* 5-Step Visual Progression */}
            <div className="grid grid-cols-5 gap-1 text-center pt-1">
              {[
                { key: 'pending', label: 'Placed' },
                { key: 'accepted', label: 'Accepted' },
                { key: 'preparing', label: 'Cooking' },
                { key: 'ready', label: 'Runner' },
                { key: 'delivered', label: 'Delivered' },
              ].map((step, idx) => {
                const stages = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];
                const currentStageIdx = stages.indexOf(activeOrders[0].status);
                const isPassed = currentStageIdx >= idx;
                const isCurrent = currentStageIdx === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        isPassed
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      } ${isCurrent ? 'animate-bounce' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1 ${isPassed ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu Section Header */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              In-Room Gourmet Dining
            </h2>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                className="rounded text-amber-500"
              />
              🥬 Pure Veg
            </label>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const inCartQty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3.5 items-center justify-between shadow-sm hover:border-amber-500/40 transition-all"
              >
                <div className="flex gap-3 items-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase text-white ${
                        item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {item.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm">{item.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                    <div className="font-black text-amber-500 text-sm mt-1">₹{(item.price_paise / 100).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {inCartQty === 0 ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-1">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs px-1 text-amber-500">{inCartQty}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs"
                      >
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

      {/* Floating Bottom Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black shadow-2xl flex items-center justify-between hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-sm">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} in Tray</span>
              </div>
              <div className="flex items-center gap-2 font-black text-sm">
                <span>₹{(cartTotalPaise / 100).toFixed(2)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Tray Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  Your Dining Order
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = menuItems.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-sm">{item.name}</div>
                        <div className="text-amber-500 font-bold">₹{((item.price_paise * qty) / 100).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-black">{qty}</span>
                        <button
                          onClick={() => addToCart(id)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Special Chef Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Mild spice, extra ice in coconut water"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(cartTotalPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% Server Verified)</span>
                  <span>₹{((cartTotalPaise * 0.18) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-200 dark:border-slate-800 text-amber-500">
                  <span>Estimated Total</span>
                  <span>₹{((cartTotalPaise * 1.23) / 100).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-xl hover:brightness-105 transition-all"
              >
                Send Order to Kitchen 🍳
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Butler / Amenities Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2">
              <ConciergeBell className="w-5 h-5 text-amber-500" />
              Request Butler & Amenities
            </h3>

            {requestSuccess ? (
              <div className="py-6 text-center text-emerald-500 font-bold space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="text-sm">Request Dispatched! Housekeeping notified.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-400">Department</label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value as 'housekeeping' | 'amenities' | 'front_desk')}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="housekeeping">Housekeeping & Towels</option>
                    <option value="amenities">Spa Toiletries & Diffuser</option>
                    <option value="front_desk">Front Desk & Luggage</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400">Request Item</label>
                  <input
                    type="text"
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsRequestModalOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendRequest}
                    className="w-1/2 py-2.5 rounded-xl font-black bg-amber-500 text-slate-950 shadow"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Folio / Bill Modal */}
      {isBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-lg flex items-center gap-2">
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
