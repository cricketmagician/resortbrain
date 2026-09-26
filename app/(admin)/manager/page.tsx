"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { KpiTile } from "@/components/ui/ops-kit/kpi-tile";
import {
  AnimatedSvgChart,
  DepartmentBenchmarkBars,
} from "@/components/ui/ops-kit/animated-svg-chart";
import {
  HOURLY_SERVICE_VOLUME,
  DEPT_RESPONSE_BENCHMARKS,
} from "@/db/seed/ops/seed-data";
import {
  LayoutDashboard,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  X,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { formatPaiseToINR } from "@/lib/utils";

export default function ManagerDashboardPage() {
  const {
    slaAlerts,
    dismissSlaAlert,
    reassignSlaAlert,
    currentHotel,
    showToast,
  } = useOps();

  const [dismissReasonModalId, setDismissReasonModalId] = useState<string | null>(null);
  const [dismissReasonText, setDismissReasonText] = useState("Guest contacted front desk directly");

  const handleDismiss = (alertId: string) => {
    dismissSlaAlert(alertId, dismissReasonText);
    setDismissReasonModalId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Executive Operations Overview</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                Live Telemetry
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Department response velocity, SLA escalation radar, and real-time revenue telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Period: <span className="text-slate-200 font-semibold">Today (Live)</span>
          </span>
        </div>
      </div>

      {/* 2. Top KPI Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Avg Response Time"
          value="4m 12s"
          trendPercentage={-18.4}
          trendDirection="down"
          isPositiveGood={true}
          subtext="Target goal: < 5m 00s"
          icon={<Clock className="w-4 h-4 text-emerald-400" />}
        />

        <KpiTile
          label="Active SLA Alerts"
          value={`${slaAlerts.length} Critical`}
          badgeLabel="Requires Action"
          badgeVariant={slaAlerts.length > 0 ? "rose" : "emerald"}
          subtext="Unacknowledged tasks"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
        />

        <KpiTile
          label="Orders Processed"
          value="184 Orders"
          trendPercentage={12.5}
          trendDirection="up"
          isPositiveGood={true}
          subtext="98.2% on-time fulfillment"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />

        <KpiTile
          label="Today's Ops Revenue"
          value="₹2,48,920"
          subtext="Derived from 41 active stays"
          badgeLabel="INR Minor Units"
          badgeVariant="emerald"
          icon={<Sparkles className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* 3. Critical SLA Escalation Radar (P0 Alerts Requiring Intervention) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Critical SLA Escalation Radar (P0 Duty Interventions)
            </h2>
          </div>
          <span className="font-mono text-xs text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-semibold">
            {slaAlerts.length} Unresolved
          </span>
        </div>

        {slaAlerts.length > 0 ? (
          <div className="space-y-3">
            {slaAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === "critical"
                    ? "bg-rose-950/30 border-rose-800/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    : "bg-amber-950/30 border-amber-800/80"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                          alert.severity === "critical"
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-amber-500 text-black"
                        }`}
                      >
                        {alert.severity === "critical" ? "P0 BREACH" : "WARNING"}
                      </span>
                      <span className="font-bold text-white text-sm">
                        Room {alert.roomNumber} - {alert.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans">
                      <span className="font-semibold text-rose-300">Reason: </span>
                      {alert.reason} • Overdue by {alert.overdueMinutes}m • Dept:{" "}
                      <span className="font-mono uppercase font-semibold text-slate-200">
                        {alert.department}
                      </span>
                    </p>

                    <div className="text-[11px] font-mono text-slate-400">
                      Escalated to: <span className="text-slate-200">{alert.escalatedTo}</span>
                      {alert.staffAssigned && (
                        <span> • Assigned: <span className="text-emerald-400">{alert.staffAssigned}</span></span>
                      )}
                    </div>
                  </div>

                  {/* Operational Override Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => reassignSlaAlert(alert.id, "Rosa Martinez (Lead)")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                    >
                      Reassign to Rosa M
                    </button>

                    <button
                      onClick={() =>
                        showToast({
                          type: "info",
                          title: "Intercom Dispatch",
                          message: `Voice line opened to Front Desk Counter 1 for Room ${alert.roomNumber}`,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Call Desk</span>
                    </button>

                    <button
                      onClick={() => setDismissReasonModalId(alert.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors"
                    >
                      Dismiss (Reason)
                    </button>
                  </div>
                </div>

                {/* Inline Dismissal Reason Input */}
                {dismissReasonModalId === alert.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      value={dismissReasonText}
                      onChange={(e) => setDismissReasonText(e.target.value)}
                      placeholder="Mandatory dismissal reason..."
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        Confirm Dismissal
                      </button>
                      <button
                        onClick={() => setDismissReasonModalId(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-emerald-400 font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero breached tasks in escalation queue. All SLAs satisfied!</span>
          </div>
        )}
      </div>

      {/* 4. Analytics & Trends (Pure Zero-Dependency SVG Chart Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Volume Hourly Curve */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Service Request Volume Hourly Curve (08:00 - 24:00)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">
              Peak: 42 at 14:00
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Real-time hourly demand telemetry. Zero bundle bloat (Pure SVG Bezier spline).
          </p>
          <div className="pt-2">
            <AnimatedSvgChart
              dataPoints={HOURLY_SERVICE_VOLUME}
              height={190}
              lineColor="#10b981"
              fillGradient={true}
              unit="requests"
            />
          </div>
        </div>

        {/* Department Response Time Benchmark */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Department Response Velocity Benchmark (Minutes)
            </h3>
            <span className="text-[10px] font-mono text-indigo-400">
              Amber Notch = SLA Target Goal
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Average time from ticket creation to first physical staff action.
          </p>
          <div className="pt-4">
            <DepartmentBenchmarkBars benchmarks={DEPT_RESPONSE_BENCHMARKS} />
          </div>
        </div>
      </div>
    </div>
  );
}
