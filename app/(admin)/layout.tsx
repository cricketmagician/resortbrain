"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOps } from "@/lib/ops-store";
import {
  LayoutDashboard,
  Settings,
  Globe2,
  FileCode2,
  FileBarChart2,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentHotel, allHotels, switchHotel, currentStaff, theme, toggleTheme } = useOps();
  const isLightMode = theme === "light";

  const adminNav = [
    {
      label: "[5] Manager Dashboard",
      href: "/manager",
      icon: LayoutDashboard,
    },
    {
      label: "[6] Hotel Config & Catalog",
      href: "/hotel",
      icon: Settings,
    },
    {
      label: "[7] Platform Admin (SaaS HQ)",
      href: "/platform",
      icon: Globe2,
    },
    {
      label: "[8] Immutable Audit Log",
      href: "/audit",
      icon: FileCode2,
    },
    {
      label: "Reports & Exports",
      href: "/reports",
      icon: FileBarChart2,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20">
      {/* 1. Global Admin Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  Grand Azure Control Plane
                </span>
                <span className="text-[10px] text-slate-400 font-mono -mt-0.5">
                  Executive Suite & Oversight
                </span>
              </div>
            </Link>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Tenant Gating Badge */}
            <div className="hidden md:flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-full text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">Tenant Isolation:</span>
              <span className="font-mono text-indigo-300 font-bold">
                ENFORCED (RLS)
              </span>
            </div>
          </div>

          {/* Right Header Navigation & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hotel Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currentHotel.id}
                onChange={(e) => switchHotel(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {allHotels.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                    {h.name} (#{h.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Toggle Light / Dark mode"
            >
              {isLightMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Return to Staff Workspaces */}
            <Link
              href="/kitchen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Staff Workspaces</span>
            </Link>
          </div>
        </div>

        {/* 2. Admin Navigation Sub-Bar */}
        <div className="bg-slate-900/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto">
            <nav className="flex space-x-1 sm:space-x-3 py-2">
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all select-none whitespace-nowrap",
                      isActive
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-inner"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-500">Security:</span>
              <span className="text-indigo-400">Zero-Trust Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Admin Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* 4. Admin Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/95 py-2.5 px-4 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>Control Mode: Executive</span>
            <span>•</span>
            <span>
              Tenant: <span className="text-slate-200">{currentHotel.name}</span>
            </span>
            <span>•</span>
            <span className="text-indigo-400">Auth Scope: Strict RLS</span>
          </div>
          <div className="flex items-center gap-2">
            <span>SaaS Control Plane v3.0</span>
            <span>•</span>
            <span className="text-emerald-400">All Nodes Healthy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
