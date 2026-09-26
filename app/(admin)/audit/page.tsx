"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { AuditLogItem } from "@/modules/ops/types";
import {
  FileCode2,
  Download,
  Filter,
  Search,
  Clock,
  Shield,
  ExternalLink,
  ChevronRight,
  Code2,
  Sparkles,
} from "lucide-react";

export default function AuditLogViewerPage() {
  const { auditLogs, currentHotel, showToast } = useOps();

  const [selectedTraceId, setSelectedTraceId] = useState<string>("tr_f88019aa");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedLog =
    auditLogs.find((log) => log.traceId === selectedTraceId) || auditLogs[0];

  const filteredLogs = auditLogs.filter((log) => {
    if (eventTypeFilter !== "ALL" && log.eventType !== eventTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.traceId.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.entityTarget.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const csvHeader = "Timestamp,Actor,EventType,EntityTarget,IPAddress,TraceId\n";
    const csvRows = filteredLogs
      .map(
        (l) =>
          `"${l.timestamp}","${l.actorName}","${l.eventType}","${l.entityTarget}","${l.ipAddress}","${l.traceId}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${currentHotel.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: "success",
      title: "Audit Log CSV Exported",
      message: `${filteredLogs.length} immutable entries exported with cryptographic trace IDs.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>System Audit Trail & Compliance Log</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                100% READ-ONLY
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Append-only immutable event ledger with cryptographically verifiable actor and trace IDs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trace ID, actor, target IP..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Filter Event:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-mono focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="order.accepted">order.accepted</option>
            <option value="order.created">order.created</option>
            <option value="folio.manual_discount">folio.manual_discount</option>
            <option value="audit.support_access">audit.support_access</option>
            <option value="notification.escalated">notification.escalated</option>
          </select>
        </div>
      </div>

      {/* 3. Main Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3.5">Timestamp (UTC)</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5">Event Type</th>
              <th className="px-4 py-3.5">Entity Target</th>
              <th className="px-4 py-3.5">IP / Trace ID</th>
              <th className="px-4 py-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
            {filteredLogs.map((log) => {
              const isSelected = selectedLog?.traceId === log.traceId;
              const eventColorMap: Record<string, string> = {
                "order.created": "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
                "order.accepted": "text-teal-400 bg-teal-950/60 border-teal-800/50",
                "folio.manual_discount": "text-amber-400 bg-amber-950/60 border-amber-800/50",
                "audit.support_access": "text-indigo-400 bg-indigo-950/60 border-indigo-800/50",
                "notification.escalated": "text-rose-400 bg-rose-950/60 border-rose-800/50",
                "tenant.suspended": "text-rose-500 bg-rose-950 border-rose-800 font-bold",
              };
              const eventColor = eventColorMap[log.eventType] || "text-slate-300 bg-slate-800";

              return (
                <tr
                  key={log.id}
                  onClick={() => setSelectedTraceId(log.traceId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-slate-800/80" : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3.5 font-sans font-medium text-white">
                    {log.actorName}
                    <div className="text-[10px] text-slate-500 font-mono">{log.actorId}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${eventColor}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-200">
                    {log.entityTarget}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                    <div>{log.ipAddress}</div>
                    <div className="text-emerald-400 font-bold">{log.traceId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected ? "text-emerald-400 bg-slate-900" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Audit Payload Inspector (Read-Only JSON Viewer) */}
      {selectedLog && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Audit Payload Inspector (Read-Only JSON Record)
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Trace:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {selectedLog.traceId}
              </span>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed selection:bg-emerald-900 selection:text-white">
            {JSON.stringify(
              {
                event: selectedLog.eventType,
                actor_id: selectedLog.actorId,
                actor_name: selectedLog.actorName,
                hotel_id: selectedLog.hotelId,
                entity_target: selectedLog.entityTarget,
                ip_address: selectedLog.ipAddress,
                trace_id: selectedLog.traceId,
                timestamp_utc: selectedLog.timestamp,
                payload: selectedLog.payload,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
