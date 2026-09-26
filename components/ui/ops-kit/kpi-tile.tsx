"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface KpiTileProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  trendPercentage?: number;
  trendDirection?: "up" | "down" | "neutral";
  isPositiveGood?: boolean;
  isLoading?: boolean;
  subtext?: string;
  badgeLabel?: string;
  badgeVariant?: "default" | "emerald" | "amber" | "rose";
  icon?: React.ReactNode;
  className?: string;
}

export function KpiTile({
  label,
  value,
  previousValue,
  trendPercentage,
  trendDirection,
  isPositiveGood = true,
  isLoading = false,
  subtext,
  badgeLabel,
  badgeVariant = "default",
  icon,
  className,
}: KpiTileProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 bg-slate-800 rounded" />
          <div className="h-5 w-5 bg-slate-800 rounded-full" />
        </div>
        <div className="h-8 w-32 bg-slate-800 rounded mb-2" />
        <div className="h-3 w-40 bg-slate-800 rounded" />
      </div>
    );
  }

  // Calculate trend direction if not explicitly given
  const resolvedDirection =
    trendDirection ||
    (trendPercentage !== undefined
      ? trendPercentage > 0
        ? "up"
        : trendPercentage < 0
        ? "down"
        : "neutral"
      : "neutral");

  // Determine trend color based on whether positive is good
  const isGood =
    resolvedDirection === "up"
      ? isPositiveGood
      : resolvedDirection === "down"
      ? !isPositiveGood
      : true;

  const trendColorClass =
    resolvedDirection === "neutral"
      ? "text-slate-400 bg-slate-800/80"
      : isGood
      ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"
      : "text-rose-400 bg-rose-950/60 border-rose-800/40";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950/90 p-5 shadow-lg hover:border-slate-700/80 transition-all duration-200",
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && <div className="text-slate-400 group-hover:text-slate-200 transition-colors">{icon}</div>}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
      </div>

      {/* Bottom Subtext & Trend Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-xs">
        {trendPercentage !== undefined ? (
          <div
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold border",
              trendColorClass
            )}
          >
            {resolvedDirection === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : resolvedDirection === "down" ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {trendPercentage > 0 ? `+${trendPercentage}%` : `${trendPercentage}%`}
            </span>
          </div>
        ) : badgeLabel ? (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border",
              badgeVariant === "emerald"
                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                : badgeVariant === "amber"
                ? "bg-amber-950 text-amber-300 border-amber-800"
                : badgeVariant === "rose"
                ? "bg-rose-950 text-rose-300 border-rose-800"
                : "bg-slate-800 text-slate-300 border-slate-700"
            )}
          >
            {badgeLabel}
          </span>
        ) : null}

        {subtext && (
          <span className="text-slate-400 text-[11px] truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
