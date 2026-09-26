"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import {
  FileBarChart2,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatPaiseToINR } from "@/lib/utils";

export default function ReportsPage() {
  const { currentHotel, showToast } = useOps();

  const [dateRange, setDateRange] = useState("7d");
  const [department, setDepartment] = useState("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const reportData = [
    { dept: "Kitchen & In-Room Dining", tickets: 894, avgTime: "14.1m", breaches: 2, revPaise: 84210000 },
    { dept: "Front Desk & Concierge", tickets: 312, avgTime: "2.1m", breaches: 0, revPaise: 125000000 },
    { dept: "Housekeeping & Linens", tickets: 412, avgTime: "18.2m", breaches: 3, revPaise: 0 },
    { dept: "Spa & Wellness Desk", tickets: 145, avgTime: "5.4m", breaches: 0, revPaise: 42100000 },
  ];

  const handleGenerateExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      if (exportFormat === "csv") {
        const header = "Department,TotalTickets,AvgFulfillmentTime,SlaBreaches,RevenuePaise\n";
        const rows = reportData
          .map((r) => `"${r.dept}",${r.tickets},"${r.avgTime}",${r.breaches},${r.revPaise}`)
          .join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ops-report-${currentHotel.id}-${dateRange}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ops-report-${currentHotel.id}-${dateRange}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setIsExporting(false);
      showToast({
        type: "success",
        title: "Export File Generated",
        message: `Department metrics for ${dateRange} exported as ${exportFormat.toUpperCase()}.`,
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-700/60 flex items-center justify-center text-teal-400">
            <FileBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Operational Reports &amp; Export Generator
            </h1>
            <p className="text-xs text-slate-400">
              Department SLA compliance analytics, ticket throughput, and compliance data packages
            </p>
          </div>
        </div>

        {/* Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="today" className="bg-slate-900">Today (Live)</option>
              <option value="7d" className="bg-slate-900">Last 7 Days</option>
              <option value="30d" className="bg-slate-900">Last 30 Days</option>
              <option value="q3" className="bg-slate-900">Q3 2026</option>
            </select>
          </div>

          {/* Format */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Format:</span>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="csv" className="bg-slate-900">CSV Spreadsheet</option>
              <option value="json" className="bg-slate-900">JSON Archive</option>
            </select>
          </div>

          {/* Generate Export Button */}
          <button
            onClick={handleGenerateExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating..." : "GENERATE EXPORT FILE"}</span>
          </button>
        </div>
      </div>

      {/* 2. Aggregate Summary Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest Requests Block */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Guest Service Requests Summary
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              99.3% On-Time
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Total Requests</div>
              <div className="text-lg font-bold text-white">412</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Avg Response</div>
              <div className="text-lg font-bold text-emerald-400">2.8m</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-sans">SLA Breaches</div>
              <div className="text-lg font-bold text-amber-400">3 (0.7%)</div>
            </div>
          </div>
        </div>

        {/* Kitchen Orders Block */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Kitchen Orders &amp; In-Room Dining
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              894 Completed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Kitchen Tickets</div>
              <div className="text-lg font-bold text-white">894</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Avg Ticket Prep</div>
              <div className="text-lg font-bold text-indigo-400">14.1m</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Total F&amp;B Rev</div>
              <div className="text-base font-bold text-emerald-400">₹8,42,100</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Department Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Department Performance &amp; SLA Breakdown ({dateRange})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-sans font-semibold">
              <tr>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5 text-center">Tickets Handled</th>
                <th className="px-4 py-3.5 text-center">Avg Response</th>
                <th className="px-4 py-3.5 text-center">SLA Breaches</th>
                <th className="px-4 py-3.5 text-right">Revenue (Minor Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-sans font-semibold text-white">
                    {row.dept}
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-200">
                    {row.tickets}
                  </td>
                  <td className="px-4 py-3.5 text-center text-emerald-400 font-bold">
                    {row.avgTime}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.breaches > 0
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "text-slate-500"
                      }`}
                    >
                      {row.breaches}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-white">
                    {row.revPaise > 0 ? formatPaiseToINR(row.revPaise) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
