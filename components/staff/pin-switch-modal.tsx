"use client";

import React, { useState } from "react";
import { PremiumDialog } from "@/components/ui/ops-kit/premium-dialog";
import { useOps } from "@/lib/ops-store";
import { UserCheck, KeyRound, AlertCircle } from "lucide-react";

interface PinSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PinSwitchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { allStaff, currentStaff, switchStaffWithPin } = useOps();
  const [selectedStaffId, setSelectedStaffId] = useState(allStaff[0]?.id || "");
  const [pinCode, setPinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedStaff = allStaff.find((s) => s.id === selectedStaffId);

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const success = switchStaffWithPin(selectedStaffId, pinCode);
    if (success) {
      setPinCode("");
      onClose();
    } else {
      setErrorMsg(`Invalid PIN. Hint: ${selectedStaff?.name}'s demo PIN is ${selectedStaff?.pin}`);
    }
  };

  return (
    <PremiumDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Shared Tablet Quick Operator Switch"
      description="Fast PIN authentication for multi-shift station tablets."
      maxWidth="sm"
    >
      <form onSubmit={handleSwitch} className="space-y-4">
        {errorMsg && (
          <div className="rounded-lg bg-rose-950/60 border border-rose-800 p-2.5 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Staff Member
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {allStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} — {staff.roleTitle} ({staff.department})
              </option>
            ))}
          </select>
        </div>

        {selectedStaff && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-200 uppercase tracking-wider">
                {selectedStaff.department}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Default Station:</span>
              <span className="text-slate-300 font-mono">{selectedStaff.station}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shift Window:</span>
              <span className="text-slate-300">{selectedStaff.shift}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-mono pt-1 border-t border-slate-800/60 text-[11px]">
              <span>Demo PIN:</span>
              <span>{selectedStaff.pin}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            Enter 4-Digit Staff PIN
          </label>
          <input
            type="password"
            maxLength={4}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="••••"
            autoFocus
            className="w-full text-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50"
          >
            Switch Active Shift
          </button>
        </div>
      </form>
    </PremiumDialog>
  );
}
