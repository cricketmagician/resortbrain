'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useGuestApiSource } from '@/lib/guest/data';
import { GUEST_COPY } from '@/lib/guest/copy';

export function DemoDataBadge() {
  const pathname = usePathname();
  const source = useGuestApiSource();
  const [dismissed, setDismissed] = useState(false);

  // This badge floats in the bottom-left corner assuming the hotel shell's reserved bottom-nav
  // padding is under it. /offline and /q/[token] render outside that shell (no bottom padding),
  // so on a short viewport the badge can sit on top of real content there instead of empty space.
  if (pathname === '/offline' || pathname.startsWith('/q/')) return null;
  if (source !== 'mock' || dismissed) return null;

  return (
    <div className="no-print fixed bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] left-4 z-20">
      <div className="flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-2 py-1 pl-3 pr-1.5 text-xs text-ink-muted shadow-rb-2">
        {GUEST_COPY.demo.badge}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="grid size-6 place-items-center rounded-full hover:bg-surface-3 focus-ring"
        >
          <X aria-hidden className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
