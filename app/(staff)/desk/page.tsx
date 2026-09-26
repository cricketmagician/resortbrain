"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { DataTable } from "@/components/ui/ops-kit/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StayFolio } from "@/modules/ops/types";
import { formatPaiseToINR } from "@/lib/utils";
import { DeskAdjustmentModal } from "@/components/staff/desk-adjustment-modal";
import {
  ConciergeBell,
  CreditCard,
  Send,
  Printer,
  PlusCircle,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function FrontDeskPage() {
  const { folios, currentHotel, showToast } = useOps();
  const [selectedFolioId, setSelectedFolioId] = useState<string>("fol_101");
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const selectedFolio = folios.find((f) => f.id === selectedFolioId) || folios[0];

  const columns: ColumnDef<StayFolio>[] = [
    {
      accessorKey: "roomNumber",
      header: "Room",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded-md text-xs">
          #{row.original.roomNumber}
        </span>
      ),
    },
    {
      accessorKey: "guestName",
      header: "Guest Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100">{row.original.guestName}</span>
          {row.original.isVip && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-black">
              VIP
            </span>
          )}
        </div>
      ),
    },
    {
      id: "dates",
      header: "Stay Window",
      cell: ({ row }) => (
        <span className="text-xs text-slate-400 font-mono">
          {row.original.checkIn} → {row.original.checkOut}
        </span>
      ),
    },
    {
      accessorKey: "totalDuePaise",
      header: "Folio Bal (Server Minor Units)",
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-emerald-400">
            {formatPaiseToINR(row.original.totalDuePaise)}
          </div>
          <div className="text-[10px] text-slate-500">
            {row.original.totalDuePaise.toLocaleString()} paise
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color = {
          "Checked In": "bg-emerald-950 text-emerald-300 border-emerald-800",
          "Active Due": "bg-amber-950 text-amber-300 border-amber-800",
          "Check-Out": "bg-rose-950 text-rose-300 border-rose-800",
          "Clean Ready": "bg-slate-800 text-slate-300 border-slate-700",
        }[status];
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFolioId(row.original.id);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
            selectedFolioId === row.original.id
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
        >
          <span>View Folio</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <ConciergeBell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Front Desk & Billing Operations
            </h1>
            <p className="text-xs text-slate-400">
              Active stays, immutable billing ledger, and signed manual folio adjustments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              showToast({
                type: "info",
                title: "Walk-in Registration",
                message: "New guest session QR token generated on secure outbox.",
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Check-In / Walk-in</span>
          </button>
        </div>
      </div>

      {/* Heavy TanStack Data Table for Active Stays */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Active In-House Stays ({folios.length})
        </h2>
        <DataTable
          columns={columns}
          data={folios}
          onRowClick={(row) => setSelectedFolioId(row.id)}
          searchPlaceholder="Search Room or Guest name..."
        />
      </div>

      {/* Selected Stay Folio Inspection Drawer / Card */}
      {selectedFolio && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
          {/* Folio Metadata Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white font-mono">
                  Room #{selectedFolio.roomNumber} Folio
                </span>
                <span className="font-semibold text-emerald-400 text-base">
                  {selectedFolio.guestName}
                </span>
                {selectedFolio.isVip && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
                    VIP GUEST
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                <span>Stay Token: <span className="text-slate-200">{selectedFolio.stayToken}</span></span>
                <span>•</span>
                <span>Phone: <span className="text-slate-200">{selectedFolio.phone}</span></span>
                <span>•</span>
                <span>Taxes: <span className="text-emerald-400">GST 18% Verified</span></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Folio ID:</span>
              <code className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-1 rounded">
                {selectedFolio.id}
              </code>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Amount (INR)</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-center">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {selectedFolio.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100 font-sans">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {item.timestamp}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        item.amountPaise < 0 ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {formatPaiseToINR(item.amountPaise)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                        {item.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.auditNote ? (
                        <span
                          title={item.auditNote}
                          className="cursor-help px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]"
                        >
                          Signed: {item.auditNote.slice(0, 24)}...
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown (Strict Server Paise Display) */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div className="space-y-1 text-slate-400 text-left w-full sm:w-auto">
              <div>Total Net (Excl. Tax): <span className="text-slate-200">{formatPaiseToINR(selectedFolio.totalNetPaise)}</span></div>
              <div>CGST (9%) + SGST (9%): <span className="text-slate-200">{formatPaiseToINR(selectedFolio.cgstPaise + selectedFolio.sgstPaise)}</span></div>
            </div>

            <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-sans">
                Total Due at Settlement
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {formatPaiseToINR(selectedFolio.totalDuePaise)}
              </div>
              <div className="text-[10px] text-slate-500">
                ({selectedFolio.totalDuePaise.toLocaleString()} paise)
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>+ MANUAL ADJUSTMENT</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  showToast({
                    type: "success",
                    title: "Payment Link Dispatched",
                    message: `Secure SMS/WhatsApp payment link sent to ${selectedFolio.phone}`,
                  })
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Send className="w-4 h-4 text-indigo-400" />
                <span>SEND PAYMENT LINK</span>
              </button>

              <button
                onClick={() =>
                  showToast({
                    type: "success",
                    title: "Folio Settled & Checked Out",
                    message: `Receipt generated and room status set to DIRTY for Housekeeping turnover.`,
                  })
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>SETTLE & CHECKOUT (PRINT)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {selectedFolio && (
        <DeskAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          folioId={selectedFolio.id}
          roomNumber={selectedFolio.roomNumber}
          guestName={selectedFolio.guestName}
        />
      )}
    </div>
  );
}
