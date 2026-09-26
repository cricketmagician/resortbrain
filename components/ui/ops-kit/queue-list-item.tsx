"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { SlaBadge } from "./sla-badge";
import { OrderItemModifier, TicketStatus } from "@/modules/ops/types";
import { AlertCircle, UserCheck, Flame, Loader2 } from "lucide-react";

export interface QueueListItemProps {
  id: string;
  ticketNumber: string;
  roomNumber: string;
  guestName?: string;
  timestamp: string;
  dueAt: string;
  status: TicketStatus;
  items?: OrderItemModifier[];
  note?: string;
  vip?: boolean;
  priority?: boolean;
  acceptedBy?: string;
  primaryAction: {
    label: string;
    onClick: () => Promise<void | boolean>;
    isLoading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function QueueListItem({
  id,
  ticketNumber,
  roomNumber,
  guestName,
  timestamp,
  dueAt,
  status,
  items = [],
  note,
  vip = false,
  priority = false,
  acceptedBy,
  primaryAction,
  secondaryAction,
  className,
}: QueueListItemProps) {
  const [isMutating, setIsMutating] = useState(false);

  const handlePrimaryClick = async () => {
    if (isMutating || primaryAction.disabled) return;
    setIsMutating(true);
    try {
      await primaryAction.onClick();
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div
      data-testid={`queue-item-${id}`}
      className={cn(
        "min-w-[320px] max-w-[380px] flex-shrink-0 flex flex-col justify-between rounded-xl border bg-slate-900/95 p-4 shadow-xl transition-all duration-200 select-none",
        status === "ready"
          ? "border-emerald-600/60 shadow-emerald-950/20"
          : priority || vip
          ? "border-amber-500/70 shadow-amber-950/20"
          : "border-slate-800 hover:border-slate-700",
        className
      )}
    >
      {/* Top Header Card */}
      <div className="space-y-2 border-b border-slate-800 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white tracking-tight">
              {ticketNumber}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs font-semibold text-slate-300 font-mono">
              Rm {roomNumber}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {vip && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black">
                VIP
              </span>
            )}
            {priority && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                <Flame className="w-3 h-3 mr-0.5" /> RUSH
              </span>
            )}
          </div>
        </div>

        {/* Timestamps & SLA Badge */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span suppressHydrationWarning className="text-slate-400 font-mono text-[11px]">
            Placed: {timestamp}
          </span>
          <SlaBadge dueAt={dueAt} />
        </div>

        {acceptedBy && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-0.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Accepted by: {acceptedBy}</span>
          </div>
        )}
      </div>

      {/* Items List Viewport */}
      <div className="py-3 space-y-2.5 flex-1 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex items-baseline justify-between font-semibold text-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-emerald-400 font-bold">
                  {item.quantity}x
                </span>
                <span>{item.name}</span>
              </span>
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <ul className="pl-6 mt-0.5 space-y-0.5 text-xs text-amber-300">
                {item.modifiers.map((mod, mIdx) => (
                  <li key={mIdx}>• {mod}</li>
                ))}
              </ul>
            )}

            {/* Allergens Bold Warning Badge */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="pl-6 mt-1 flex flex-wrap gap-1">
                {item.allergens.map((alg, aIdx) => (
                  <span
                    key={aIdx}
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950 text-rose-200 border border-rose-500/80"
                  >
                    <AlertCircle className="w-2.5 h-2.5" /> ALLERGY: {alg}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Special Instructions Note */}
        {note && (
          <div className="mt-2 rounded-lg bg-amber-950/40 border border-amber-800/50 p-2 text-xs text-amber-200 font-medium">
            <span className="font-bold text-amber-300">Note: </span>
            {note}
          </div>
        )}
      </div>

      {/* Action Footer (Touch Targets >= 52px high) */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <button
          onClick={handlePrimaryClick}
          disabled={isMutating || primaryAction.disabled}
          className={cn(
            "w-full min-h-[52px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]",
            status === "pending"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50"
              : status === "accepted"
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50"
              : status === "preparing"
              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200",
            primaryAction.disabled ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          {isMutating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Server...</span>
            </>
          ) : (
            <span>{primaryAction.label}</span>
          )}
        </button>

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="w-full py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
