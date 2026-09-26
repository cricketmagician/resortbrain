'use client';

import { useEffect, useState } from 'react';
import { Share } from 'lucide-react';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { Button } from '@/components/ui/guest-kit/button';
import { useGuestSession } from '@/lib/guest/session';
import { useOrders, useRequests } from '@/lib/guest/data/hooks';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { PublicHotel } from '@/lib/guest/types';

const VISIT_COUNT_KEY = 'rb.visitCount';
const DISMISSED_KEY = 'rb.install.dismissedAt';
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasRecentlyDismissed(): boolean {
  let dismissedAt = 0;
  try {
    dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? '0');
  } catch {
    return false;
  }
  if (!dismissedAt) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

// The install sheet (docs/m2/06 §3): shown after the guest's first order/request, or on their
// third visit — never on the first load, never again for 7 days after a dismiss, never once
// already installed. beforeinstallprompt only fires on Android/Chromium, so iOS gets the same
// sheet with manual steps instead, and every other browser gets nothing (progressive enhancement).
export function InstallPrompt({ hotel }: { hotel: PublicHotel }) {
  const session = useGuestSession(hotel.id);
  const { data: orders } = useOrders(session);
  const { data: requests } = useRequests(session);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [thirdVisit, setThirdVisit] = useState(false);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // UA sniffing and the visit counter both read browser-only state that can't be known until
    // after hydration (mirrors the theme-toggle pattern), so this whole one-shot sync — including
    // the two setState calls — has to happen here rather than in a lazy useState initializer.
    if (isStandalone()) return;
    let count = 1;
    try {
      count = Number(localStorage.getItem(VISIT_COUNT_KEY) ?? '0') + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(count));
    } catch {
      // ignore — worst case the visit-count trigger just never fires this session
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsIosDevice(isIos());
    setThirdVisit(count >= 3);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const hasActivity = (orders?.length ?? 0) > 0 || (requests?.length ?? 0) > 0;
  const eligible = hasActivity || thirdVisit;
  const canPrompt = isIosDevice || !!deferredPrompt;

  useEffect(() => {
    // Same one-shot-after-checking-browser-state case as above: this is the "should the sheet
    // open" decision, and it can only be made once matchMedia/localStorage are safe to read.
    if (shown || !eligible || !canPrompt) return;
    if (isStandalone() || wasRecentlyDismissed()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(true);
    setOpen(true);
  }, [shown, eligible, canPrompt]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  async function handleAdd() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  }

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && dismiss()} title={GUEST_COPY.install.title(hotel.shortName)} description={GUEST_COPY.install.body}>
      <div className="flex flex-col gap-4">
        {isIos() ? (
          <ol className="flex flex-col gap-3">
            {GUEST_COPY.install.ios.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink-muted">{i + 1}</span>
                {i === 0 && <Share aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={1.75} />}
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={handleAdd}>
            {GUEST_COPY.install.addToHomeScreen}
          </Button>
        )}
        <Button variant="ghost" size="md" fullWidth onClick={dismiss}>
          {GUEST_COPY.install.notNow}
        </Button>
      </div>
    </Sheet>
  );
}
