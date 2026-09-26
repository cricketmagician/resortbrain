"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function PremiumDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  className,
}: PremiumDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape & trap focus
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Glassmorphic Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Surface */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/95 p-6 shadow-2xl shadow-black/60 ring-1 ring-white/[0.04] transition-all text-slate-100",
          maxWidthClass,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
