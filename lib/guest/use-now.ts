'use client';

// lib/guest/use-now.ts
// A ticking clock for relative-time labels and delay thresholds that must update on their own
// (docs/m2/04 §8: "Placed 6 min ago" every 30s, DelayNotice thresholds) without a page reload.

import { useEffect, useState } from 'react';

export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
