"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Flame, CheckCircle } from "lucide-react";

export interface SlaBadgeProps {
  dueAt: string | Date;
  completedAt?: string | Date | null;
  warningThresholdMinutes?: number;
  className?: string;
}

export function SlaBadge({
  dueAt,
  completedAt = null,
  warningThresholdMinutes = 5,
  className,
}: SlaBadgeProps) {
  const [diffMinutes, setDiffMinutes] = useState<number>(() => {
    const dueTime = new Date(dueAt).getTime();
    return Math.round((dueTime - Date.now()) / 60000);
  });

  // Keep countdown live without page refreshes
  useEffect(() => {
    if (completedAt) return;
    const interval = setInterval(() => {
      const dueTime = new Date(dueAt).getTime();
      setDiffMinutes(Math.round((dueTime - Date.now()) / 60000));
    }, 10000);
    return () => clearInterval(interval);
  }, [dueAt, completedAt]);

  // Case 1: Completed
  if (completedAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700",
          className
        )}
      >
        <CheckCircle className="w-3 h-3 text-slate-400" />
        Completed
      </span>
    );
  }

  // Case 2: Breached (diff < 0)
  if (diffMinutes < 0) {
    const overdueMins = Math.abs(diffMinutes);
    return (
      <span
        className={cn(
          "relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/12 text-rose-300 border border-rose-500/25",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400"></span>
        </span>
        <Flame className="w-3 h-3 text-rose-400" />
        <span>SLA OVERDUE ({overdueMins}m)</span>
      </span>
    );
  }

  // Case 3: Warning (0 <= diff <= 5 mins)
  if (diffMinutes <= warningThresholdMinutes) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/12 text-amber-300 border border-amber-500/25 animate-pulse",
          className
        )}
      >
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span>SLA: {diffMinutes === 0 ? "<1m left" : `${diffMinutes}m left`}</span>
      </span>
    );
  }

  // Case 4: Healthy / Good (> 5 mins)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        className
      )}
    >
      <Clock className="w-3 h-3 text-emerald-400" />
      <span>SLA: {diffMinutes}m left</span>
    </span>
  );
}
