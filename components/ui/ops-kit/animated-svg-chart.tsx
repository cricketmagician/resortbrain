"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedSvgChartProps {
  dataPoints: Array<{ label: string; value: number }>;
  height?: number;
  lineColor?: string;
  fillGradient?: boolean;
  unit?: string;
  className?: string;
}

export function AnimatedSvgChart({
  dataPoints,
  height = 180,
  lineColor = "#10b981",
  fillGradient = true,
  unit = "orders",
  className,
}: AnimatedSvgChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-500 font-mono"
      >
        No chart metrics available
      </div>
    );
  }

  const values = dataPoints.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const width = 600;
  const paddingX = 30;
  const paddingY = 25;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const points = dataPoints.map((pt, i) => {
    const x = paddingX + (i / (dataPoints.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - ((pt.value - minValue) / range) * plotHeight;
    return { x, y, label: pt.label, value: pt.value };
  });

  // Build smooth bezier curve path string
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  // Closed area path for gradient
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const gradientId = `chart-grad-${lineColor.replace("#", "")}`;

  return (
    <div className={cn("relative w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Horizontal Guide Lines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = paddingY + plotHeight * pct;
          const val = Math.round(maxValue - pct * range);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={paddingX - 6}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-500 select-none"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Filled Area Gradient */}
        {fillGradient && <path d={areaD} fill={`url(#${gradientId})`} />}

        {/* Main Line Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Data Points and Hover Targets */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 6 : 4}
              fill="#020617"
              stroke={lineColor}
              strokeWidth={hoveredIdx === idx ? 3 : 2}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* Label below X axis */}
            <text
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              className={cn(
                "text-[10px] font-mono select-none transition-colors",
                hoveredIdx === idx ? "fill-slate-100 font-bold" : "fill-slate-500"
              )}
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute -top-3 transform -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs font-mono shadow-xl pointer-events-none z-20 text-slate-200"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
          }}
        >
          <div className="text-white font-bold">
            {points[hoveredIdx].value} {unit}
          </div>
          <div className="text-[10px] text-slate-400">
            Time: {points[hoveredIdx].label}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Clean zero-dependency horizontal benchmark bars
 */
export function DepartmentBenchmarkBars({
  benchmarks,
}: {
  benchmarks: Array<{ label: string; value: number; goal: number }>;
}) {
  const maxVal = Math.max(...benchmarks.map((b) => Math.max(b.value, b.goal)), 25);

  return (
    <div className="space-y-3.5">
      {benchmarks.map((bm, idx) => {
        const valuePct = (bm.value / maxVal) * 100;
        const goalPct = (bm.goal / maxVal) * 100;
        const isBetter = bm.value <= bm.goal;

        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">{bm.label}</span>
              <div className="flex items-center gap-2 font-mono">
                <span
                  className={cn(
                    "font-bold",
                    isBetter ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {bm.value}m
                </span>
                <span className="text-slate-500 text-[10px]">
                  (Goal: {bm.goal}m)
                </span>
              </div>
            </div>

            <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              {/* Actual bar */}
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isBetter ? "bg-emerald-500" : "bg-rose-500"
                )}
                style={{ width: `${valuePct}%` }}
              />
              {/* Goal indicator notch */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10"
                style={{ left: `${goalPct}%` }}
                title={`Target Goal: ${bm.goal}m`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
