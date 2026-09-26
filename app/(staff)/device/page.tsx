"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { kitchenAudioEngine } from "@/lib/audio-engine";
import {
  Tablet,
  BellRing,
  KeyRound,
  Apple,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

export default function DeviceSetupPage() {
  const {
    deviceConfig,
    currentStaff,
    allStaff,
    switchStaffWithPin,
    showToast,
    isSoundMuted,
  } = useOps();

  const [deviceName, setDeviceName] = useState(deviceConfig.deviceName);
  const [assignedDept, setAssignedDept] = useState(deviceConfig.assignedDept);
  const [assignedRole, setAssignedRole] = useState(deviceConfig.assignedRole);
  const [deviceMode, setDeviceMode] = useState<"shared" | "personal">(deviceConfig.mode);

  const [selectedStaffId, setSelectedStaffId] = useState(allStaff[0]?.id || "");
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const [isTestPushing, setIsTestPushing] = useState(false);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: "success",
      title: "Device Profile Bound",
      message: `Station identifier updated: ${deviceName} (${assignedDept}).`,
    });
  };

  const handleQuickPinSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const target = allStaff.find((s) => s.id === selectedStaffId);
    const ok = switchStaffWithPin(selectedStaffId, pinCode);
    if (ok) {
      setPinCode("");
    } else {
      setPinError(`Incorrect PIN code. Demo PIN for ${target?.name} is ${target?.pin}`);
    }
  };

  const handleTestChimeAndPush = () => {
    setIsTestPushing(true);
    kitchenAudioEngine.playOrderChime();
    setTimeout(() => {
      showToast({
        type: "success",
        title: "Web Push (VAPID RFC-8292) Delivered",
        message: "Payload { event: 'order.created', ticket: '#0425' } successfully received by ServiceWorker v3.0.",
      });
      setIsTestPushing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Device Registration & Push Gateway
            </h1>
            <p className="text-xs text-slate-400">
              Station hardware profile, Web Push VAPID subscription, and shared tablet authentication
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Device: Active & Bound
          </span>
        </div>
      </div>

      {/* Top 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Hardware & Station Identifier */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Tablet className="w-4 h-4 text-cyan-400" />
            Hardware & Station Identifier
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Assigned Department
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="kitchen">Food & Beverage (Kitchen)</option>
                  <option value="desk">Front Desk & Concierge</option>
                  <option value="housekeeping">Housekeeping & Floor</option>
                  <option value="admin">Executive Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Assigned Station Role
                </label>
                <input
                  type="text"
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-2">
                Operational Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-semibold transition-all ${
                    deviceMode === "shared"
                      ? "bg-cyan-950/40 border-cyan-500 text-cyan-200"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="devMode"
                    checked={deviceMode === "shared"}
                    onChange={() => setDeviceMode("shared")}
                  />
                  <span>Shared Tablet PIN Mode</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer font-semibold transition-all ${
                    deviceMode === "personal"
                      ? "bg-cyan-950/40 border-cyan-500 text-cyan-200"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="devMode"
                    checked={deviceMode === "personal"}
                    onChange={() => setDeviceMode("personal")}
                  />
                  <span>Personal Staff Handset</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Update Device Profile
            </button>
          </form>
        </div>

        {/* Panel 2: Notification Gateway Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Notification Gateway Status
            </h2>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Push Engine:</span>
                <span className="text-slate-200 font-bold">
                  Web Push (VAPID RFC-8292)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Permission Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  GRANTED (Active)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Endpoint UUID:</span>
                <span className="text-slate-400 truncate max-w-[200px]">
                  {deviceConfig.endpointUuid}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Service Worker:</span>
                <span className="text-emerald-400">
                  {deviceConfig.swVersion}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 font-sans">Hardware Audio Engine:</span>
                <span className="text-slate-200 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Unlocked (User Gesture OK)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleTestChimeAndPush}
            disabled={isTestPushing}
            className="w-full py-3 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <BellRing className="w-4 h-4" />
            <span>
              {isTestPushing
                ? "Simulating Web Push Relay..."
                : "Send Test Chime & Push Notification"}
            </span>
          </button>
        </div>
      </div>

      {/* Panel 3: Shared Tablet Quick Operator Switch (PIN Login) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Shared Tablet Quick Operator Switch (PIN Login)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Active Operator:{" "}
              <span className="text-emerald-400 font-semibold">
                {currentStaff.name} ({currentStaff.roleTitle})
              </span>{" "}
              • Shift ends in: <span className="font-mono text-slate-300">2h 45m</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickPinSwitch} className="space-y-4">
          {pinError && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200">
              {pinError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Switch Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  setPinError(null);
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {allStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — {staff.roleTitle} (PIN: {staff.pin})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                4-Digit PIN Code
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-base tracking-widest text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 transition-all active:scale-95"
            >
              Switch Active Shift Operator
            </button>
          </div>
        </form>
      </div>

      {/* Panel 4: Apple iOS Safari Web Push Compliance */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Apple className="w-4 h-4 text-slate-300" />
          Apple iOS PWA Setup Compliance (Safari Web Push)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/40 text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 1: Safari</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Open Grand Azure URL in Mobile Safari directly.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/40 text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 2: Share Icon</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Tap iOS Share button &gt; &quot;Add to Home Screen&quot;.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/40 text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 3: Standalone</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Launch from Home Screen (Standalone mode active).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/40 text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 4: Permissions</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Accept iOS system alert for lock-screen alerts.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 gap-2">
          <span>
            Fallback Polling Loop:{" "}
            <span className="text-emerald-400">
              STANDBY (Push Active)
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            If WebSocket or Push drops, fails over to 5,000ms background heartbeat.
          </span>
        </div>
      </div>
    </div>
  );
}
