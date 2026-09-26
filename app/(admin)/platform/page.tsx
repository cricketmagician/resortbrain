"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { PremiumDialog } from "@/components/ui/ops-kit/premium-dialog";
import { HotelTenant } from "@/modules/ops/types";
import {
  Globe2,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Key,
  Ban,
  Clock,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { formatPaiseToINR } from "@/lib/utils";

export default function PlatformAdminPage() {
  const { allHotels, suspendTenant, showToast, currentStaff } = useOps();

  const [selectedTenant, setSelectedTenant] = useState<HotelTenant | null>(null);
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);
  const [suspendConfirmText, setSuspendConfirmText] = useState("");
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const openBreakGlass = (tenant: HotelTenant) => {
    setSelectedTenant(tenant);
    setSuspendConfirmText("");
    setSuspendError(null);
    setIsBreakGlassOpen(true);
  };

  const handleInitiateSupportSession = () => {
    if (!selectedTenant) return;
    showToast({
      type: "warning",
      title: "Break-Glass Session Activated",
      message: `15-minute cryptographic session established for ${selectedTenant.name}. Trace logged to audit ledger.`,
    });
    setIsBreakGlassOpen(false);
  };

  const handleConfirmSuspension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    if (suspendConfirmText !== `SUSPEND ${selectedTenant.id}`) {
      setSuspendError(`Confirmation text must exactly match 'SUSPEND ${selectedTenant.id}'`);
      return;
    }

    suspendTenant(selectedTenant.id);
    setIsBreakGlassOpen(false);
  };

  // Aggregates
  const totalHotels = allHotels.length;
  const totalRooms = allHotels.reduce((acc, h) => acc + h.rooms, 0);
  const totalActiveStays = allHotels.reduce((acc, h) => acc + h.activeStays, 0);
  const totalMrrPaise = allHotels.reduce((acc, h) => acc + h.mrrPaise, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Platform Control Plane</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                TENANT ISOLATION: ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              SaaS control operator deck: Multi-tenant resource caps, break-glass impersonation, and tenant suspension
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Operator:</span>
          <span className="text-indigo-400 font-bold">sys_lead@saas.com (SuperAdmin)</span>
        </div>
      </div>

      {/* 2. Global Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Total Hotels:</span>
          <span className="text-lg font-bold font-mono text-white">{totalHotels}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Total Rooms:</span>
          <span className="text-lg font-bold font-mono text-slate-200">{totalRooms}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Active Stays:</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{totalActiveStays}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">Monthly SaaS MRR:</span>
          <span className="text-base font-bold font-mono text-emerald-400">
            {formatPaiseToINR(totalMrrPaise)}
          </span>
        </div>
      </div>

      {/* 3. Registered Hotel Tenants Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Registered Hotel Tenants ({allHotels.length})
          </h2>
          <button
            onClick={() =>
              showToast({
                type: "info",
                title: "Tenant Onboarding",
                message: "Postgres schema tenant provisioning wizard initiated.",
              })
            }
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            + Onboard New Tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Tenant ID</th>
                <th className="px-4 py-3">Hotel Name</th>
                <th className="px-4 py-3">Plan Tier</th>
                <th className="px-4 py-3">Room Capacity</th>
                <th className="px-4 py-3">Active Stays</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {allHotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-indigo-400">
                    #{hotel.id}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-white">
                    {hotel.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                      {hotel.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono">{hotel.rooms} Rooms</td>
                  <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                    {hotel.activeStays} Stays
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        hotel.status === "ACTIVE"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {hotel.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => openBreakGlass(hotel)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      Break-Glass Controls...
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-Glass Support Session / Tenant Suspension Dialog */}
      {selectedTenant && (
        <PremiumDialog
          isOpen={isBreakGlassOpen}
          onClose={() => setIsBreakGlassOpen(false)}
          title={`Break-Glass Control Session: ${selectedTenant.name}`}
          description={`Target Tenant: #${selectedTenant.id} • All actions cryptographically recorded in the master audit log.`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-xs">
            {/* 1. Time-limited Support Impersonation */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Key className="w-4 h-4" />
                <span>15-Minute Support Impersonation Protocol</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Generates a time-limited ephemeral JWT token granting read-only diagnostics for customer support investigations. All requests are watermarked with your operator ID.
              </p>
              <button
                onClick={handleInitiateSupportSession}
                className="w-full py-2.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all"
              >
                INITIATE LOGGED SUPPORT SESSION (15m)
              </button>
            </div>

            {/* 2. Critical Zone: Tenant Suspension */}
            <div className="rounded-xl bg-rose-950/20 p-4 border border-rose-900/60 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>CRITICAL ZONE: Suspend Hotel Operations</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Immediately revokes all active staff session tokens, locks guest QR ordering channels, and blocks real-time events across the entire hotel cluster.
              </p>

              <form onSubmit={handleConfirmSuspension} className="space-y-3 pt-2">
                {suspendError && (
                  <div className="p-2 rounded bg-rose-950 text-rose-200 border border-rose-800 text-[11px]">
                    {suspendError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    To confirm suspension, type <span className="font-mono text-rose-400 font-bold">SUSPEND {selectedTenant.id}</span> below:
                  </label>
                  <input
                    type="text"
                    value={suspendConfirmText}
                    onChange={(e) => setSuspendConfirmText(e.target.value)}
                    placeholder={`SUSPEND ${selectedTenant.id}`}
                    className="w-full px-3 py-2 bg-slate-950 border border-rose-900/80 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBreakGlassOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 transition-all"
                  >
                    CONFIRM SUSPENSION (RED)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </PremiumDialog>
      )}
    </div>
  );
}
