"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  Headphones,
  Sliders,
  Sun,
  Moon,
} from "lucide-react";
import { useOps } from "@/lib/ops-store";
import { formatNumber } from "@/lib/utils";

export default function PricingPage() {
  const { theme, toggleTheme } = useOps();
  const [isAnnual, setIsAnnual] = useState(true);
  const [customRooms, setCustomRooms] = useState(85);

  const estimatedLaborSavingsMonthly = Math.round(customRooms * 145);
  const estimatedOrderSpeedUp = "3.8x faster";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Marketing Top Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Grand Azure SaaS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link href="/kitchen" className="hover:text-emerald-400 transition-colors">
              Kitchen Display (KDS)
            </Link>
            <Link href="/staff" className="hover:text-emerald-400 transition-colors">
              Staff Management
            </Link>
            <Link href="/desk" className="hover:text-emerald-400 transition-colors">
              Front Desk & Billing
            </Link>
            <Link href="/manager" className="hover:text-emerald-400 transition-colors">
              Manager SLA Radar
            </Link>
            <Link href="/pricing" className="text-emerald-400 font-semibold">
              Pricing & Plans
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Light / Dark mode"
            >
              {theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <Link
              href="/kitchen"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
            >
              Launch Live Ops Demo
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-12 px-4 max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
          <Zap className="w-3.5 h-3.5" />
          <span>Zero-Lag Hotel Operations Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Simple, Predictable Pricing for Modern Hoteliers
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Empower your team with zero-lag guest QR ordering, kitchen display systems, live SLA escalation, and multi-tenant control.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="pt-6 flex items-center justify-center gap-3 select-none">
          <span
            className={`text-xs font-semibold cursor-pointer ${
              !isAnnual ? "text-white" : "text-slate-400"
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly Billing
          </span>

          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-slate-800 rounded-full p-1 border border-slate-700 transition-colors relative"
            aria-label="Toggle annual billing"
          >
            <div
              className={`w-4 h-4 bg-emerald-400 rounded-full transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>

          <span
            className={`text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              isAnnual ? "text-emerald-300" : "text-slate-400"
            }`}
            onClick={() => setIsAnnual(true)}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
              Save 20%
            </span>
          </span>
        </div>
      </section>

      {/* 3. Pricing Cards Grid */}
      <section className="pb-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Tier 1: Boutique */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">BOUTIQUE</h2>
                <p className="text-xs text-slate-400 mt-1">
                  For small boutique inns, chalets, and bed & breakfasts.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white">
                  ${isAnnual ? "159" : "199"}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 font-mono">
                Up to 35 rooms included
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Guest Mobile QR Web App</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>1 Kitchen Display Terminal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Web Push (VAPID) Notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Standard Shift & Revenue Reporting</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500 line-through">
                  <span>Manager SLA Escalation Radar</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500 line-through">
                  <span>Multi-Tenant HQ Control</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/kitchen"
                className="w-full py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Tier 2: Resort Professional (Featured) */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between shadow-2xl shadow-emerald-950/40 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-lg">
              Most Popular Choice
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>RESORT PROFESSIONAL</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-occupancy luxury beach resorts and convention properties.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white">
                  ${isAnnual ? "399" : "499"}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 font-mono">
                Up to 150 rooms included
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold text-white">Everything in Boutique, plus:</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>5 Concurrent Kitchen Stations (KDS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Housekeeping Matrix & Turnover Board</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Manager Live Dashboard & SLA Radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>White-Label Guest Branding & Colors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Front Desk Folio Adjustments & Invoicing</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/kitchen"
                className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Tier 3: Enterprise Chain */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">ENTERPRISE CHAIN</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Multi-property hospitality empires and international hotel chains.
                </p>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white">
                  Custom
                </span>
                <span className="text-xs text-slate-400">volume pricing</span>
              </div>
              <div className="text-xs font-semibold text-indigo-400 font-mono">
                Unlimited rooms &amp; properties
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Multi-Hotel Platform HQ Overview</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Custom PMS & Accounting Adapters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>99.9% Financially-Backed SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>24/7 Dedicated Solutions Engineer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Immutable Audit Ledger Export & PCI Support</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/platform"
                className="w-full py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
              >
                Talk to Sales &amp; Custom Onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Room Capacity ROI Calculator */}
      <section className="py-12 px-4 max-w-4xl mx-auto border-t border-slate-800 text-center space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          Interactive Room Capacity &amp; ROI Calculator
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Slide your property&apos;s total key count to preview projected operational efficiency gains.
        </p>

        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-slate-400">Total Rooms / Keys:</span>
            <span className="text-xl font-bold text-emerald-400">{customRooms} Rooms</span>
          </div>

          <input
            type="range"
            min="10"
            max="350"
            step="5"
            value={customRooms}
            onChange={(e) => setCustomRooms(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-left font-mono">
            <div>
              <div className="text-[11px] text-slate-500 font-sans">Est. Monthly Labor Savings</div>
              <div className="text-xl font-bold text-white">${formatNumber(estimatedLaborSavingsMonthly)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-sans">Kitchen Ticket Turnaround</div>
              <div className="text-xl font-bold text-emerald-400">{estimatedOrderSpeedUp}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
