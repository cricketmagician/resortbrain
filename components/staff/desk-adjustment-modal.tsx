"use client";

import React, { useState } from "react";
import { PremiumDialog } from "@/components/ui/ops-kit/premium-dialog";
import { useOps } from "@/lib/ops-store";
import { formatPaiseToINR } from "@/lib/utils";
import { ShieldCheck, AlertCircle, FileText } from "lucide-react";

interface DeskAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  folioId: string;
  roomNumber: string;
  guestName: string;
}

export function DeskAdjustmentModal({
  isOpen,
  onClose,
  folioId,
  roomNumber,
  guestName,
}: DeskAdjustmentModalProps) {
  const { addFolioAdjustment, currentStaff } = useOps();

  const [adjustmentType, setAdjustmentType] = useState<"discount" | "charge">("discount");
  const [amountRupees, setAmountRupees] = useState<string>("500.00");
  const [reasonCategory, setReasonCategory] = useState<string>("Service Recovery (Delay)");
  const [mandatoryNote, setMandatoryNote] = useState<string>("Guest waited 45 mins for luggage delivery");
  const [managerKey, setManagerKey] = useState<string>("9999");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived paise strictly computed
  const numRupees = parseFloat(amountRupees) || 0;
  const serverPaise = Math.round(numRupees * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numRupees <= 0) {
      setErrorMsg("Amount must be greater than zero.");
      return;
    }
    if (mandatoryNote.trim().length < 10) {
      setErrorMsg("Mandatory audit note must be at least 10 characters detailing the incident.");
      return;
    }
    if (!managerKey) {
      setErrorMsg("Manager override key is mandatory.");
      return;
    }

    const success = addFolioAdjustment(
      folioId,
      adjustmentType,
      serverPaise,
      reasonCategory,
      mandatoryNote,
      managerKey
    );

    if (success) {
      onClose();
    } else {
      setErrorMsg("Manager override key rejected (Use 9999 or 1234 for demo).");
    }
  };

  return (
    <PremiumDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Manual Folio Adjustment - Room #${roomNumber}`}
      description="Action is signed and written to the immutable audit ledger with your staff ID."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Box */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 text-xs flex items-center justify-between text-slate-300">
          <div>
            <span className="text-slate-500">Guest:</span>{" "}
            <span className="font-semibold text-white">{guestName}</span>
          </div>
          <div>
            <span className="text-slate-500">Folio:</span>{" "}
            <span className="font-mono text-emerald-400 font-semibold">{folioId}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-950/60 border border-rose-800 p-2.5 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Adjustment Type Radio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                adjustmentType === "discount"
                  ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="adjType"
                checked={adjustmentType === "discount"}
                onChange={() => setAdjustmentType("discount")}
                className="text-emerald-500 focus:ring-0"
              />
              <span>Credit / Discount (-)</span>
            </label>

            <label
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                adjustmentType === "charge"
                  ? "bg-amber-950/40 border-amber-500 text-amber-200"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="adjType"
                checked={adjustmentType === "charge"}
                onChange={() => setAdjustmentType("charge")}
                className="text-amber-500 focus:ring-0"
              />
              <span>Extra Charge (+)</span>
            </label>
          </div>
        </div>

        {/* Amount in INR */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amount (INR)
            </label>
            <span className="text-[11px] font-mono text-emerald-400">
              Server Value: {serverPaise.toLocaleString()} paise
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Reason Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Reason Category
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="Service Recovery (Delay)">Service Recovery (Luggage / Room Delay)</option>
            <option value="Room Quality Concern">Room Quality Concern / Noise Complaint</option>
            <option value="Billing Discrepancy Correction">Billing Discrepancy Correction</option>
            <option value="Manager Courtesy VIP">Manager Courtesy VIP Perk</option>
            <option value="Late Check-out Fee">Late Check-out Extended Stay Fee</option>
          </select>
        </div>

        {/* Mandatory Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Mandatory Audit Note
          </label>
          <textarea
            rows={2}
            value={mandatoryNote}
            onChange={(e) => setMandatoryNote(e.target.value)}
            placeholder="Describe reason for financial adjustment..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Authorizing Role / Manager Override Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Manager Override Key
            </label>
            <span className="text-[10px] text-slate-500">Demo Key: 9999</span>
          </div>
          <input
            type="password"
            maxLength={6}
            value={managerKey}
            onChange={(e) => setManagerKey(e.target.value)}
            placeholder="Enter 4-digit manager PIN"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
          >
            Confirm & Sign Entry
          </button>
        </div>
      </form>
    </PremiumDialog>
  );
}
