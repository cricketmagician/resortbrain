"use client";

import React, { useState, useEffect } from "react";
import { useOps } from "@/lib/ops-store";
import { QueueListItem } from "@/components/ui/ops-kit/queue-list-item";
import { EmptyErrorState } from "@/components/ui/ops-kit/empty-error-state";
import {
  UtensilsCrossed,
  Volume2,
  VolumeX,
  PlusCircle,
  Filter,
  Clock,
  Printer,
  BellRing,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatOpsTime } from "@/lib/utils";

export default function KitchenKDSPage() {
  const {
    kitchenTickets,
    acceptTicket,
    startPrepTicket,
    readyTicket,
    simulateIncomingOrder,
    isSoundMuted,
    toggleSound,
    showToast,
  } = useOps();

  const [selectedStation, setSelectedStation] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live real-time clock ticker
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter tickets
  const filteredTickets = kitchenTickets.filter((ticket) => {
    if (statusFilter === "active") {
      return (
        ticket.status === "pending" ||
        ticket.status === "accepted" ||
        ticket.status === "preparing"
      );
    }
    if (statusFilter === "ready") {
      return ticket.status === "ready";
    }
    return true; // "all"
  });

  // Calculate live stats
  const pendingCount = kitchenTickets.filter((t) => t.status === "pending").length;
  const preparingCount = kitchenTickets.filter(
    (t) => t.status === "accepted" || t.status === "preparing"
  ).length;
  const readyCount = kitchenTickets.filter((t) => t.status === "ready").length;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Line 1 Touchscreen
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Realtime kitchen rail channel: <code className="text-emerald-400 font-mono">hotel:h_901:dept:kitchen</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Station Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Stations</option>
              <option value="Hot Line" className="bg-slate-900">Hot Line #2</option>
              <option value="Grill" className="bg-slate-900">Grill Station #1</option>
              <option value="Pastry" className="bg-slate-900">Pastry & Cold Prep</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="active" className="bg-slate-900">
                Active ({pendingCount + preparingCount})
              </option>
              <option value="ready" className="bg-slate-900">
                Ready for Pickup ({readyCount})
              </option>
              <option value="all" className="bg-slate-900">
                All Tickets ({kitchenTickets.length})
              </option>
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            {isSoundMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">SOUND: OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">SOUND: ON</span>
              </>
            )}
          </button>

          {/* Time Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime || "12:44:18 PM"}</span>
          </div>

          {/* Add simulated test order */}
          <button
            onClick={simulateIncomingOrder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
            title="Fire an incoming guest ticket with synthesized audio chime"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Pending:</span>
          <span className="text-lg font-bold font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
            {pendingCount}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Preparing:</span>
          <span className="text-lg font-bold font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
            {preparingCount}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Ready for Pickup:</span>
          <span className="text-lg font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            {readyCount}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Avg Prep Time:</span>
          <span className="text-sm font-bold font-mono text-slate-200">
            11m 40s
          </span>
        </div>
      </div>

      {/* 3. Horizontal Rail of Tickets (Ergonomic Wall Touchscreen Layout) */}
      <div className="min-h-[500px]">
        {filteredTickets.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
            {filteredTickets.map((ticket) => {
              // Action logic per status
              const primaryActionConfig = {
                pending: {
                  label: "ACCEPT ORDER (Tap/Spc)",
                  onClick: async () => {
                    await acceptTicket(ticket.id);
                  },
                },
                accepted: {
                  label: "START PREP (Cook Line)",
                  onClick: async () => {
                    await startPrepTicket(ticket.id);
                  },
                },
                preparing: {
                  label: "MARK READY / CHIME",
                  onClick: async () => {
                    await readyTicket(ticket.id);
                  },
                },
                ready: {
                  label: "ORDER DELIVERED (Close)",
                  onClick: async () => {
                    showToast({
                      type: "info",
                      title: "Ticket Archived",
                      message: `Order ${ticket.ticketNumber} delivered to guest folio.`,
                    });
                  },
                },
                delivered: {
                  label: "COMPLETED",
                  onClick: async () => {},
                },
                cancelled: {
                  label: "CANCELLED",
                  onClick: async () => {},
                },
              }[ticket.status];

              return (
                <QueueListItem
                  key={ticket.id}
                  id={ticket.id}
                  ticketNumber={ticket.ticketNumber}
                  roomNumber={ticket.roomNumber}
                  guestName={ticket.guestName}
                  timestamp={formatOpsTime(ticket.placedAt)}
                  dueAt={ticket.dueAt}
                  status={ticket.status}
                  items={ticket.items}
                  note={ticket.note}
                  vip={ticket.vip}
                  priority={ticket.priority}
                  acceptedBy={ticket.acceptedBy}
                  primaryAction={primaryActionConfig}
                  secondaryAction={{
                    label:
                      ticket.status === "pending"
                        ? "Reject / Hold"
                        : ticket.status === "preparing"
                        ? "Call Runner Alert"
                        : "Print Kitchen Slip",
                    onClick: () => {
                      showToast({
                        type: "info",
                        title: "Thermal Printer Slip Dispatched",
                        message: `Kitchen chit printed for ${ticket.ticketNumber} (Room ${ticket.roomNumber})`,
                      });
                    },
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-20">
            <EmptyErrorState
              variant="no-orders"
              title="All Kitchen Tickets Cleared"
              message="No orders pending for the selected station filter. Great work Chef!"
              actionLabel="Simulate Incoming Order (<1s)"
              onAction={simulateIncomingOrder}
            />
          </div>
        )}
      </div>
    </div>
  );
}
