import type { Metadata, Viewport } from 'next';
import { OfflineBanner } from '@/components/guest/offline-banner';
import { DemoDataBadge } from '@/components/guest/demo-data-badge';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#070B14',
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
      <DemoDataBadge />
    </>
  );
}
