'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/guest-kit/toast';
import { GUEST_COPY } from '@/lib/guest/copy';

// Registers /sw.js after window.load (docs/m2/06 §2) and offers a Refresh toast once a new worker
// has installed and is waiting to take over.
export function SwRegistrar() {
  const { show } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const allowedInDev = process.env.NEXT_PUBLIC_SW_IN_DEV === '1';
    if (process.env.NODE_ENV !== 'production' && !allowedInDev) return;

    let cancelled = false;

    function handleRegistration(registration: ServiceWorkerRegistration) {
      function notifyUpdateReady(worker: ServiceWorker) {
        show({
          tone: 'info',
          title: GUEST_COPY.update.ready,
          durationMs: 20000,
          action: {
            label: GUEST_COPY.update.refresh,
            onClick: () => {
              worker.postMessage({ type: 'SKIP_WAITING' });
              navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
            },
          },
        });
      }

      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateReady(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdateReady(installing);
          }
        });
      });
    }

    function onLoad() {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          if (!cancelled) handleRegistration(registration);
        })
        .catch(() => {
          // registration failing (e.g. unsupported browser context) just means no offline support
        });
    }

    // By the time this effect runs (after hydration), the native load event has often already
    // fired — attaching a listener at that point would wait forever, so register immediately
    // when the document is already complete.
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }
    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
    };
  }, [show]);

  return null;
}
