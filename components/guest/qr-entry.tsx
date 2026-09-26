'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGuestApi, GuestApiError } from '@/lib/guest/data';
import { saveSession } from '@/lib/guest/session';
import { GUEST_COPY } from '@/lib/guest/copy';
import { Button } from '@/components/ui/guest-kit/button';
import { GUEST_TID } from './test-ids';
import { RejoinScreen } from './rejoin-screen';

type QrState = { kind: 'resolving' } | { kind: 'error'; message: string } | { kind: 'invalid' };

const RESOLVE_TIMEOUT_MS = 8000;
const SLOW_HINT_MS = 2500;

export function QrEntry({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<QrState>({ kind: 'resolving' });
  const [slow, setSlow] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_HINT_MS);

    async function attempt() {
      try {
        const api = await getGuestApi();
        const session = await Promise.race([
          api.resolveQr(token),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new GuestApiError('timeout', 'The request timed out.')), RESOLVE_TIMEOUT_MS);
          }),
        ]);
        if (cancelled) return;

        saveSession(session);
        router.prefetch(`/h/${session.hotelSlug}`);
        router.prefetch(`/h/${session.hotelSlug}/menu`);
        router.replace(`/h/${session.hotelSlug}?welcome=1`);
      } catch (err) {
        if (cancelled) return;
        const apiErr = err instanceof GuestApiError ? err : new GuestApiError('server', 'Something went wrong.');

        if (apiErr.kind === 'invalid' || apiErr.kind === 'not_found') {
          setState({ kind: 'invalid' });
        } else if (apiErr.kind === 'rate_limited') {
          setState({ kind: 'error', message: `You're going a bit fast. Try again in ${apiErr.retryAfterSec ?? 10}s.` });
        } else {
          setState({ kind: 'error', message: GUEST_COPY.qr.error.body });
        }
      }
    }

    attempt();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [token, router, retryKey]);

  if (state.kind === 'invalid') {
    return <RejoinScreen reason="invalid" />;
  }

  return (
    <div data-theme="dark" className="dark flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      {state.kind === 'resolving' ? (
        <div data-testid={GUEST_TID.qrLoading}>
          <div className="relative mx-auto mb-6 size-20">
            <span aria-hidden className="absolute inset-0 rounded-full border-2 border-line-strong" />
            <span aria-hidden className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent [animation-duration:1.4s]" />
            <span className="absolute inset-0 grid place-items-center font-display text-lg text-accent">RB</span>
          </div>
          <p className="font-display text-2xl text-ink">{GUEST_COPY.qr.resolving}</p>
          <div aria-hidden className="mt-4 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-ink-subtle" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          {slow && <p className="mt-6 max-w-xs text-sm text-ink-muted">{GUEST_COPY.qr.slow}</p>}
        </div>
      ) : (
        <div data-testid={GUEST_TID.qrError}>
          <p className="font-display text-xl text-ink">{GUEST_COPY.qr.error.title}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">{state.message}</p>
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setState({ kind: 'resolving' });
                setSlow(false);
                setRetryKey((k) => k + 1);
              }}
              data-testid={GUEST_TID.qrRetry}
            >
              {GUEST_COPY.common.retry}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
