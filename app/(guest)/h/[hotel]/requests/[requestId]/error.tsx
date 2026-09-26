'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { GUEST_COPY } from '@/lib/guest/copy';

export default function RequestTrackingError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-xl text-ink">{GUEST_COPY.qr.error.title}</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">{GUEST_COPY.qr.error.body}</p>
      <Button variant="primary" size="lg" onClick={() => retry()} className="mt-6">
        {GUEST_COPY.common.retry}
      </Button>
    </div>
  );
}
