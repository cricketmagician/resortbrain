'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/guest-kit/toast';
import { GUEST_COPY } from '@/lib/guest/copy';

// Reads ?welcome=1 directly from window.location instead of useSearchParams(), so this doesn't
// need a Suspense boundary on an otherwise-static page — it's a one-time check, not something
// that needs to react to further param changes.
export function WelcomeToast({ hotelName }: { hotelName: string }) {
  const { show } = useToast();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('welcome') !== '1') return;

    show({ tone: 'success', title: GUEST_COPY.home.welcomeToast(hotelName) });

    url.searchParams.delete('welcome');
    const query = url.searchParams.toString();
    window.history.replaceState(null, '', url.pathname + (query ? `?${query}` : '') + url.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show() identity is stable per ToastProvider mount; re-running on it would re-fire the toast
  }, [hotelName]);

  return null;
}
