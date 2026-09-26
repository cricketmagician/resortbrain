"use client";

import React from "react";
import Link from "next/link";
import { useOps } from "@/lib/ops-store";
import {
  UtensilsCrossed,
  ConciergeBell,
  BedDouble,
  Tablet,
  LayoutDashboard,
  Settings,
  Globe2,
  FileCode2,
  Tag,
  FileBarChart2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  Lock,
  Layers,
  CheckCircle2,
  Award,
} from "lucide-react";

export default function OperationsPortalHomePage() {
  const { currentHotel, kitchenTickets, slaAlerts, folios, rooms } = useOps();

  const screens = [
    {
      num: "1",
      title: "Kitchen Display System (KDS)",
      route: "/kitchen",
      icon: UtensilsCrossed,
      color: "emerald",
      badge: `${kitchenTickets.length} Tickets`,
      desc: "Hardware chime on order.created, SLA timer badges, optimistic Accept/Prep/Ready transitions.",
    },
    {
      num: "2",
      title: "Front Desk & Billing Screen",
      route: "/desk",
      icon: ConciergeBell,
      color: "indigo",
      badge: `${folios.length} In-House Stays`,
      desc: "TanStack Table for folios, server integer paise computation, signed manual audit adjustments.",
    },
    {
      num: "3",
      title: "Housekeeping Matrix & Board",
      route: "/housekeeping",
      icon: BedDouble,
      color: "teal",
      badge: `${rooms.length} Rooms`,
      desc: "Realtime room turnover matrix, optimistic status changes, guest service dispatch queue.",
    },
    {
      num: "4",
      title: "Device Setup & Push Gateway",
      route: "/device",
      icon: Tablet,
      color: "cyan",
      badge: "VAPID RFC-8292",
      desc: "Web Push notification gateway, iOS Safari PWA guide, shared tablet PIN operator switch.",
    },
    {
      num: "5",
      title: "Manager Dashboard & SLA Radar",
      route: "/manager",
      icon: LayoutDashboard,
      color: "purple",
      badge: `${slaAlerts.length} Escalations`,
      desc: "Zero-dependency pure SVG hourly volume curve, department velocity benchmarks, P0 radar.",
    },
    {
      num: "6",
      title: "Hotel Admin & Configuration",
      route: "/hotel",
      icon: Settings,
      color: "amber",
      badge: "Instant Zod",
      desc: "Menu catalog manager, station SLA assignments, floor topology, staff invite token generator.",
    },
    {
      num: "7",
      title: "Platform Admin (SaaS Control)",
      route: "/platform",
      icon: Globe2,
      color: "blue",
      badge: "Multi-Tenant",
      desc: "Global tenant metrics, MRR meters, 15-minute break-glass support session, typed suspension.",
    },
    {
      num: "8",
      title: "Immutable Audit Log Viewer",
      route: "/audit",
      icon: FileCode2,
      color: "rose",
      badge: "Append-Only",
      desc: "Cursor pagination, monospace trace IDs, JSON payload inspector, 100% read-only compliance.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-16 px-4 sm:px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-inner">
              <Award className="w-3.5 h-3.5" />
              Member 3: Equal Co-Lead • Operations &amp; Control
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-400 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Trust Multi-Tenant RLS
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Grand Azure Operations Platform
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
                Enterprise dark-mode command suite for staff, department leads, GMs, and SaaS platform operators. Built for ultra-low latency (&lt;1s) and zero layout shifts.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Link
                href="/kitchen"
                className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl shadow-emerald-950/60 flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>Open Kitchen Display (KDS)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-3 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
              >
                View Pricing Page
              </Link>
            </div>
          </div>

          {/* Core Mandate Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white font-sans text-xs">Anti-Lag &amp; Realtime</div>
                <div className="text-slate-400 text-[11px]">&lt;1s WebSocket updates + Optimistic UI</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white font-sans text-xs">Zero-Trust Security</div>
                <div className="text-slate-400 text-[11px]">Server minor units paise • 403 shield</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white font-sans text-xs">Ops-Kit 8 Components</div>
                <div className="text-slate-400 text-[11px]">Virtual tables, SLA badges, pure SVG charts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. The 8 Operational Screens Master Directory */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              The 8 Operational Surfaces (Screen 1 to 8)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              100% owned and built by Member 3 according to Master Blueprint v3.0
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            Active Tenant: {currentHotel.name} (#{currentHotel.id})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {screens.map((screen) => {
            const Icon = screen.icon;
            return (
              <Link
                key={screen.route}
                href={screen.route}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-emerald-500/70 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-lg hover:shadow-2xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center text-emerald-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Screen {screen.num}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                      {screen.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {screen.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                  <span>{screen.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Auxiliary Pages Section */}
        <div className="pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Auxiliary Pages Owned by Member 3
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/pricing"
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-cyan-500/60 hover:bg-slate-900 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-cyan-300">
                    Public Marketing Pricing Page
                  </h4>
                  <p className="text-xs text-slate-400">
                    3 tiered SaaS plans, monthly/annual switch, interactive room ROI calculator.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/reports"
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-teal-500/60 hover:bg-slate-900 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <FileBarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-teal-300">
                    Operational Reports &amp; Exports
                  </h4>
                  <p className="text-xs text-slate-400">
                    Department SLA adherence, ticket completion velocity, CSV &amp; JSON data generator.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transform group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
