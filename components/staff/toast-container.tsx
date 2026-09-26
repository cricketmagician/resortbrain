"use client";

import React from "react";
import { useOps } from "@/lib/ops-store";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, dismissToast } = useOps();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info,
        };
        const Icon = icons[toast.type];

        const borderClasses = {
          success: "border-emerald-500/60 bg-slate-900/95 text-emerald-300",
          error: "border-rose-500/80 bg-rose-950/95 text-rose-200",
          warning: "border-amber-500/70 bg-amber-950/95 text-amber-200",
          info: "border-indigo-500/60 bg-slate-900/95 text-indigo-300",
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200",
              borderClasses
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white tracking-wide">
                {toast.title}
              </h5>
              <p className="mt-0.5 text-xs text-slate-300 leading-relaxed font-normal">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
