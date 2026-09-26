"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { SlaBadge } from "@/components/ui/ops-kit/sla-badge";
import { RoomRecord, RoomCleanStatus } from "@/modules/ops/types";
import {
  BedDouble,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  User,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatOpsTime } from "@/lib/utils";

export default function HousekeepingPage() {
  const {
    rooms,
    updateRoomStatus,
    serviceRequests,
    acceptServiceRequest,
    completeServiceRequest,
    simulateIncomingServiceRequest,
    isBuzzerRinging,
    silenceBuzzer,
    currentStaff,
    showToast,
  } = useOps();

  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [filterCleanliness, setFilterCleanliness] = useState<string>("ALL");

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const filteredRooms = floorRooms.filter((r) => {
    if (filterCleanliness === "ALL") return true;
    return r.cleanStatus === filterCleanliness;
  });

  // Aggregate counts
  const cleanCount = rooms.filter((r) => r.cleanStatus === "CLEAN" || r.cleanStatus === "INSPECTED").length;
  const inProgCount = rooms.filter((r) => r.cleanStatus === "CLEANING").length;
  const dirtyCount = rooms.filter((r) => r.cleanStatus === "DIRTY").length;
  const oooCount = rooms.filter((r) => r.cleanStatus === "OOO").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Housekeeping Operations & Room Board
            </h1>
            <p className="text-xs text-slate-400">
              Live floor turnover matrix, maintenance flags, and guest service request dispatch
            </p>
          </div>
        </div>

        {/* Filter Controls & Sim Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Floor:</span>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4].map((f) => (
                <option key={f} value={f} className="bg-slate-900">
                  Floor {f}
                </option>
              ))}
            </select>
          </div>

          {/* Cleanliness Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Filter:</span>
            <select
              value={filterCleanliness}
              onChange={(e) => setFilterCleanliness(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="DIRTY" className="bg-slate-900">Dirty ({dirtyCount})</option>
              <option value="CLEANING" className="bg-slate-900">In Cleaning ({inProgCount})</option>
              <option value="CLEAN" className="bg-slate-900">Clean / Ready ({cleanCount})</option>
              <option value="OOO" className="bg-slate-900">Out of Order ({oooCount})</option>
            </select>
          </div>

          {/* Simulate New Request with Sharp Buzzer */}
          <button
            onClick={simulateIncomingServiceRequest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
            title="Fire an incoming guest service request with sharp buzzer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ New Request</span>
          </button>
        </div>
      </div>

      {/* Active Sharp Buzzer Alert Bar */}
      {isBuzzerRinging && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/50 text-amber-200 animate-pulse shadow-lg shadow-amber-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <span className="font-bold text-sm tracking-wide text-amber-100 uppercase">
                🔔 Sharp Buzzer Sounding: Unassigned Guest Service Request
              </span>
              <p className="text-xs text-amber-300/90">
                Buzzer sounds until a housekeeping staff member clicks "ASSIGN TO ME".
              </p>
            </div>
          </div>
          <button
            onClick={silenceBuzzer}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow cursor-pointer"
          >
            Silence Buzzer
          </button>
        </div>
      )}

      {/* 2. Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex justify-between items-center">
          <span className="text-slate-400">Total Rooms:</span>
          <span className="text-base font-bold text-white">{rooms.length}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex justify-between items-center">
          <span className="text-slate-400">Clean/Ready:</span>
          <span className="text-base font-bold text-emerald-400">{cleanCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex justify-between items-center">
          <span className="text-slate-400">In Progress:</span>
          <span className="text-base font-bold text-indigo-400">{inProgCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex justify-between items-center">
          <span className="text-slate-400">Dirty Turnover:</span>
          <span className="text-base font-bold text-amber-400">{dirtyCount}</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 flex justify-between items-center col-span-2 sm:col-span-1">
          <span className="text-slate-400">Out of Order:</span>
          <span className="text-base font-bold text-rose-400">{oooCount}</span>
        </div>
      </div>

      {/* 3. Room Matrix Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Floor {selectedFloor} Room Grid ({filteredRooms.length} rooms)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const cleanBadge = {
              CLEAN: "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25",
              CLEANING: "bg-indigo-500/12 text-indigo-300 border border-indigo-500/25 animate-pulse",
              DIRTY: "bg-amber-500/12 text-amber-300 border border-amber-500/25",
              INSPECTED: "bg-teal-500/12 text-teal-300 border border-teal-500/25",
              OOO: "bg-rose-500/12 text-rose-300 border border-rose-500/25",
            }[room.cleanStatus] || "bg-slate-800 text-slate-300";

            const occBadge = {
              OCC: "bg-slate-800 text-slate-200 border border-slate-700/50",
              VAC: "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25",
              DEP: "bg-amber-500/12 text-amber-300 border border-amber-500/25",
              MAINT: "bg-rose-500/12 text-rose-300 border border-rose-500/25",
            }[room.occupancyStatus];

            return (
              <div
                key={room.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-base font-bold text-white">
                      ROOM {room.roomNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${occBadge}`}
                    >
                      [{room.occupancyStatus}]
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-slate-400">{room.type}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Clean Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${cleanBadge}`}
                      >
                        {room.cleanStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Attendant:</span>
                      <span className="font-medium text-slate-300">
                        {room.attendant || "Unassigned"}
                      </span>
                    </div>

                    {room.notes && (
                      <div className="mt-2 text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/60 leading-tight">
                        {room.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instant Tap Mutation Buttons */}
                <div className="pt-2 border-t border-slate-800/80">
                  {room.cleanStatus === "DIRTY" && (
                    <button
                      onClick={() => updateRoomStatus(room.id, "CLEANING")}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 transition-all"
                    >
                      Start Cleaning
                    </button>
                  )}

                  {room.cleanStatus === "CLEANING" && (
                    <button
                      onClick={() => updateRoomStatus(room.id, "CLEAN")}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all"
                    >
                      Mark Clean
                    </button>
                  )}

                  {room.cleanStatus === "CLEAN" && (
                    <button
                      onClick={() => updateRoomStatus(room.id, "INSPECTED")}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                    >
                      Inspect / OK
                    </button>
                  )}

                  {room.cleanStatus === "INSPECTED" && (
                    <button
                      onClick={() =>
                        showToast({
                          type: "info",
                          title: "Room Available",
                          message: `Room ${room.roomNumber} ready for Front Desk check-in assignment.`,
                        })
                      }
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Set Available
                    </button>
                  )}

                  {room.cleanStatus === "OOO" && (
                    <button
                      onClick={() =>
                        showToast({
                          type: "warning",
                          title: "Maintenance Work Order #WO-891",
                          message: "Technician Robert T is on-site with AC condenser replacement.",
                        })
                      }
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-rose-950 text-rose-200 border border-rose-800 hover:bg-rose-900 transition-colors"
                    >
                      View Work Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Guest Service Requests (Housekeeping Dispatch Queue) */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Active Guest Service Requests (Housekeeping Dispatch)</span>
          <span className="font-mono text-emerald-400">{serviceRequests.length} active</span>
        </h2>

        <div className="space-y-2.5">
          {serviceRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                    Rm {req.roomNumber}
                  </span>
                  <span className="font-semibold text-slate-100 text-sm">
                    {req.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Category: {req.category}</span>
                  <span>•</span>
                  <span>Placed: {formatOpsTime(req.placedAt)}</span>
                  {req.assignedTo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">Assigned: {req.assignedTo}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <SlaBadge dueAt={req.dueAt} />

                {req.status === "created" ? (
                  <button
                    onClick={() => acceptServiceRequest(req.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                  >
                    ASSIGN TO ME
                  </button>
                ) : (
                  <button
                    onClick={() => completeServiceRequest(req.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all"
                  >
                    MARK FULFILLED
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
