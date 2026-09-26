"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  Inbox,
  WifiOff,
  AlertOctagon,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

export interface EmptyErrorStateProps {
  variant: "no-orders" | "access-denied" | "offline" | "error";
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyErrorState({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: EmptyErrorStateProps) {
  // Preset defaults per variant
  const config = {
    "no-orders": {
      icon: Inbox,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-950/40 border-emerald-800/40",
      defaultTitle: "Queue All Clear",
      defaultMessage:
        "No pending orders or service requests in this station queue right now.",
      defaultAction: "Simulate Incoming Order",
    },
    "access-denied": {
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      bgColor: "bg-rose-950/40 border-rose-800/40",
      defaultTitle: "403 Forbidden: Cross-Tenant Access Blocked",
      defaultMessage:
        "Zero-Trust Tenant Isolation prevented unauthorized cross-tenant data leakage. This incident has been logged with your session trace.",
      defaultAction: "Return to Hotel Workspace",
    },
    offline: {
      icon: WifiOff,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-950/40 border-amber-800/40",
      defaultTitle: "Operational Gateway Offline",
      defaultMessage:
        "Realtime WebSocket channel disconnected. Fallback background polling is attempting reconnection every 5,000ms.",
      defaultAction: "Reconnect Channel",
    },
    error: {
      icon: AlertOctagon,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-950/50 border-rose-800/60",
      defaultTitle: "Application State Recovered",
      defaultMessage:
        "An unexpected boundary exception was caught gracefully. The operational state has been restored.",
      defaultAction: "Reload Workspace",
    },
  }[variant];

  const Icon = config.icon;
  const resolvedTitle = title || config.defaultTitle;
  const resolvedMessage = message || config.defaultMessage;
  const resolvedAction = actionLabel || config.defaultAction;

  return (
    <div
      data-testid={variant === "access-denied" ? "access-denied-state" : `state-${variant}`}
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl max-w-lg mx-auto",
        className
      )}
    >
      {/* Icon Badge */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border shadow-inner transition-transform hover:scale-105",
          config.bgColor
        )}
      >
        <Icon className={cn("w-8 h-8", config.iconColor)} />
      </div>

      {/* Headings */}
      <h3 className="text-lg font-bold text-white tracking-tight mb-2">
        {resolvedTitle}
      </h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6 font-normal">
        {resolvedMessage}
      </p>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-md transition-all active:scale-95"
        >
          {variant === "access-denied" ? (
            <ArrowLeft className="w-4 h-4" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>{resolvedAction}</span>
        </button>
      )}
    </div>
  );
}
