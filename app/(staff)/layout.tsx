"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOps } from "@/lib/ops-store";
import {
  UtensilsCrossed,
  ConciergeBell,
  BedDouble,
  Tablet,
  Bell,
  Volume2,
  VolumeX,
  User,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Layers,
} from "lucide-react";
import { PinSwitchModal } from "@/components/staff/pin-switch-modal";
import { cn } from "@/lib/utils";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    currentHotel,
    currentStaff,
    latencyMs,
    isSimulatedOffline,
    isSoundMuted,
    toggleSound,
    slaAlerts,
    theme,
    toggleTheme,
    isBuzzerRinging,
    silenceBuzzer,
  } = useOps();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const isLightMode = theme === "light";

  const navItems = [
    {
      label: "[1] Kitchen Queue",
      href: "/kitchen",
      icon: UtensilsCrossed,
      badge: 4,
    },
    {
      label: "[2] Front Desk",
      href: "/desk",
      icon: ConciergeBell,
    },
    {
      label: "[3] Housekeeping",
      href: "/housekeeping",
      icon: BedDouble,
    },
    {
      label: "[4] Devices & Push",
      href: "/device",
      icon: Tablet,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20">
      {/* 1. Global Enterprise Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Grand Azure Ops
                </span>
                <span className="text-[10px] text-slate-400 font-mono -mt-0.5">
                  v3.0 • Mission Control
                </span>
              </div>
            </Link>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Current Hotel & Tenant ID */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Hotel:</span>
              <span className="font-semibold text-slate-200">
                {currentHotel.name}
              </span>
              <span className="font-mono text-emerald-300 bg-emerald-500/12 border border-emerald-500/25 px-2 py-0.5 rounded text-[11px]">
                #{currentHotel.id}
              </span>
            </div>
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Connection / Latency */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isSimulatedOffline
                    ? "bg-rose-500 animate-ping"
                    : "bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                )}
              />
              <span className="font-mono text-xs text-slate-300">
                {isSimulatedOffline ? "Offline" : `${latencyMs}ms Live`}
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title={isSoundMuted ? "Sound Muted" : "Web Audio ON"}
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Active Buzzer Indicator */}
            {isBuzzerRinging && (
              <button
                onClick={silenceBuzzer}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse hover:bg-amber-500/25 transition-colors cursor-pointer"
                title="Sharp buzzer active for unaccepted requests. Click to silence."
              >
                <span className="w-2 h-2 rounded-full bg-amber-400/90 animate-ping" />
                <span className="font-mono text-[11px]">BUZZER ON</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Toggle Light / Dark mode"
            >
              {isLightMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Operator Quick Switcher */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold hidden lg:inline">
                {currentStaff.name}
              </span>
              <span className="font-mono text-[10px] text-slate-400">PIN</span>
            </button>

            {/* Switch to Admin Mode */}
            <Link
              href="/manager"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/12 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Admin HQ</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 2. Secondary Staff Navigation Bar */}
        <div className="bg-slate-900/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto">
            <nav className="flex space-x-1 sm:space-x-4 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all select-none whitespace-nowrap",
                      isActive
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-inner"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-900 text-emerald-200">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Alerts Ticker */}
            <div className="hidden lg:flex items-center gap-2 pl-4 text-xs font-mono text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Active SLA Alerts:</span>
              <span className="font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-1.5 py-0.5 rounded">
                {slaAlerts.length} Critical
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Active Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* 4. Global Staff Shell Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/95 py-2.5 px-4 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Shift: <span className="text-slate-200">{currentStaff.shift}</span>
            </span>
            <span>•</span>
            <span>
              Operator:{" "}
              <span className="text-emerald-400 font-semibold">
                {currentStaff.name} ({currentStaff.roleTitle})
              </span>
            </span>
            <span>•</span>
            <span>
              Station:{" "}
              <span className="text-slate-200">{currentStaff.station}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Web Audio Synthesizer: {isSoundMuted ? "MUTED" : "ONLINE"}
            </span>
            <span>•</span>
            <span className="text-emerald-400">RTT: {latencyMs}ms</span>
          </div>
        </div>
      </footer>

      {/* Operator PIN Switch Modal */}
      <PinSwitchModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
}
