"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import {
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Flame,
  Radio,
  Building2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Sun,
  Moon,
  BellRing,
  BellOff,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DemoControlBar() {
  const {
    currentHotel,
    allHotels,
    switchHotel,
    isSoundMuted,
    toggleSound,
    isSimulatedOffline,
    toggleOffline,
    simulateRaceConditionConflict,
    setSimulateRaceConditionConflict,
    simulateIncomingOrder,
    theme,
    toggleTheme,
    isBuzzerRinging,
    silenceBuzzer,
    triggerBuzzerDemo,
    latencyMs,
  } = useOps();

  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 border border-slate-700/80 text-slate-200 hover:text-white shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-xs font-semibold group cursor-pointer"
          title="Open Demo & Testing Controls"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-emerald-400">
            {isSimulatedOffline ? "OFFLINE" : `${latencyMs}ms Live`}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 group-hover:text-emerald-300">⚡ Demo Tools</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Judge Demo and Testing Controls"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all text-xs"
    >
      {/* Mini Toggle Strip */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-200 tracking-wide uppercase">
            Operations Control Deck
          </span>
          <span className="text-slate-500 font-mono hidden sm:inline">
            | Channel: hotel:{currentHotel.id}:dept:*
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-[11px]">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>{isSimulatedOffline ? "OFFLINE" : `${latencyMs}ms Live`}</span>
          </div>

          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <span>Minimize</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Controls Toolbar */}
      {isExpanded && (
        <div className="p-3 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Tenant Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-400 font-medium">Tenant:</span>
            <select
              value={currentHotel.id}
              onChange={(e) => switchHotel(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              {allHotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id} className="bg-slate-900 text-white">
                  {hotel.name} (#{hotel.id}) {hotel.status === "SUSPENDED" ? "[SUSPENDED]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Action Trigger Buttons for Demo */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Realtime Order Simulator */}
            <button
              onClick={simulateIncomingOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
              title="Simulates an incoming guest order via Supabase Realtime with Web Audio chime"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Order (&lt;1s Chime)</span>
            </button>

            {/* Concurrency Conflict Toggle */}
            <button
              onClick={() =>
                setSimulateRaceConditionConflict(!simulateRaceConditionConflict)
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all active:scale-95",
                simulateRaceConditionConflict
                  ? "bg-rose-950/80 text-rose-200 border-rose-500 animate-pulse"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
              )}
              title="When enabled, any Accept action will simulate a 409 conflict: another cook took it first"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Race Conflict 409:{" "}
                <span className="font-mono">
                  {simulateRaceConditionConflict ? "ACTIVE (Collision)" : "OFF"}
                </span>
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={cn(
                "p-1.5 rounded-lg border transition-colors",
                isSoundMuted
                  ? "bg-slate-900 text-slate-500 border-slate-800"
                  : "bg-slate-900 text-emerald-400 border-slate-700"
              )}
              title={isSoundMuted ? "Sound Muted" : "Web Audio Synthesizer ON"}
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Offline Simulator */}
            <button
              onClick={toggleOffline}
              className={cn(
                "p-1.5 rounded-lg border transition-colors",
                isSimulatedOffline
                  ? "bg-amber-950 text-amber-300 border-amber-600"
                  : "bg-slate-900 text-slate-300 border-slate-700"
              )}
              title={
                isSimulatedOffline
                  ? "Simulated Offline Mode"
                  : "Simulate Disconnection"
              }
            >
              {isSimulatedOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
            </button>

            {/* Hardware Buzzer Manual Trigger / Silence */}
            <button
              onClick={isBuzzerRinging ? silenceBuzzer : triggerBuzzerDemo}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isBuzzerRinging
                  ? "bg-amber-500/25 border-amber-500 text-amber-200 animate-pulse"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
              )}
              title={
                isBuzzerRinging
                  ? "Buzzer active! Click to silence"
                  : "Click to test sharp hardware buzzer alarm"
              }
            >
              {isBuzzerRinging ? (
                <>
                  <BellOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Silence Buzzer</span>
                </>
              ) : (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Buzzer</span>
                </>
              )}
            </button>

            {/* Global Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-colors cursor-pointer"
              title="Toggle Light / Dark mode"
            >
              {theme === "light" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Route Shortcuts */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 overflow-x-auto max-w-full">
            <span className="text-slate-500 mr-1">Views:</span>
            <Link
              href="/kitchen"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/kitchen" ? "bg-emerald-950 text-emerald-300 font-bold" : ""
              )}
            >
              [1] Kitchen
            </Link>
            <Link
              href="/desk"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/desk" ? "bg-emerald-950 text-emerald-300 font-bold" : ""
              )}
            >
              [2] Desk
            </Link>
            <Link
              href="/housekeeping"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/housekeeping" ? "bg-emerald-950 text-emerald-300 font-bold" : ""
              )}
            >
              [3] HK Matrix
            </Link>
            <Link
              href="/device"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/device" ? "bg-emerald-950 text-emerald-300 font-bold" : ""
              )}
            >
              [4] Device
            </Link>
            <Link
              href="/manager"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/manager" ? "bg-indigo-950 text-indigo-300 font-bold" : ""
              )}
            >
              [5] Manager
            </Link>
            <Link
              href="/hotel"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/hotel" ? "bg-indigo-950 text-indigo-300 font-bold" : ""
              )}
            >
              [6] Hotel Admin
            </Link>
            <Link
              href="/platform"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/platform" ? "bg-indigo-950 text-indigo-300 font-bold" : ""
              )}
            >
              [7] SaaS HQ
            </Link>
            <Link
              href="/audit"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/audit" ? "bg-indigo-950 text-indigo-300 font-bold" : ""
              )}
            >
              [8] Audit
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/pricing" ? "bg-cyan-950 text-cyan-300 font-bold" : ""
              )}
            >
              Pricing
            </Link>
            <Link
              href="/console"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/console" ? "bg-amber-950 text-amber-300 font-bold" : ""
              )}
            >
              [9] Console
            </Link>
            <Link
              href="/guest"
              className={cn(
                "px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors",
                pathname === "/guest" ? "bg-emerald-950 text-emerald-300 font-bold" : ""
              )}
            >
              [0] Guest PWA
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
