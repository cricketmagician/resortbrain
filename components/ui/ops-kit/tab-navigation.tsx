"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className,
}: TabNavigationProps) {
  return (
    <div className={cn("border-b border-slate-800 w-full overflow-x-auto", className)}>
      <nav className="flex space-x-1 sm:space-x-2 min-w-max" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative group flex items-center gap-2 py-3 px-3.5 text-sm font-medium transition-all select-none focus:outline-none",
                isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
              )}
              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-xs font-mono font-bold",
                    isActive
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                      : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                  )}
                >
                  {tab.count}
                </span>
              )}

              {/* Animated Underline */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
