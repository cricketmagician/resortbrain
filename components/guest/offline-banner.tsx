'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/lib/guest/network';
import { GUEST_COPY } from '@/lib/guest/copy';

export function OfflineBanner() {
  const status = useNetworkStatus();
  const previousStatus = useRef(status);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const wasOfflineBefore = previousStatus.current === 'offline';
    previousStatus.current = status;
    if (status !== 'online' || !wasOfflineBefore) return;

    setJustReconnected(true);
    const timer = setTimeout(() => setJustReconnected(false), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const isOffline = status === 'offline';
  if (!isOffline && !justReconnected) return null;

  return (
    <div role="status" className="glass no-print flex items-center justify-center gap-2 border-b border-line px-4 py-2 text-sm text-ink-muted">
      {isOffline ? (
        <>
          <WifiOff aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
          {GUEST_COPY.offline.title} — {GUEST_COPY.offline.body}
        </>
      ) : (
        <>
          <Wifi aria-hidden className="size-4 text-success" strokeWidth={1.75} />
          {GUEST_COPY.offline.back}
        </>
      )}
    </div>
  );
}
