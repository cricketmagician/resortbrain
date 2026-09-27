'use client';

// lib/guest/use-now.ts
// A ticking clock for relative-time labels and delay thresholds that must update on their own
// (docs/m2/04 §8: "Placed 6 min ago" every 30s, DelayNotice thresholds) without a page reload.

import { useEffect, useState } from 'react';

// Starts at 0, not Date.now(): the value is used only for relative-time text
// ("6 min ago") and delay thresholds, and 0 makes every diff-from-now land
// deterministically on "just now" / "not delayed yet" on both server and
// client. Seeding with Date.now() had the server and client each capture a
// different real instant (SSR render time vs. hydration time), which could
// disagree by a rounding step and trigger a hydration mismatch — React then
// discards and rebuilds the affected subtree on every load.
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
