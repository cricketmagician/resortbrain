import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getPublicHotel, listHotelSlugs } from '@/lib/guest/server/hotels';
import { GuestProviders } from '@/components/guest/guest-providers';
import { AppBar } from '@/components/guest/app-bar';
import { BottomNav } from '@/components/guest/bottom-nav';

// Both are pure client-only, deferred-behaviour widgets (SW registration waits for window.load;
// the install sheet waits on visit count / first order) that render nothing until their own
// effects fire — splitting them into their own chunk keeps first-load JS down (docs/m2/06 §4)
// without changing when either actually appears on screen. (ssr: false needs a Client Component,
// and this layout is a Server Component, but both already render null on the server regardless.)
const InstallPrompt = dynamic(() => import('@/components/guest/install-prompt').then((m) => m.InstallPrompt));
const SwRegistrar = dynamic(() => import('@/components/guest/sw-registrar').then((m) => m.SwRegistrar));

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return listHotelSlugs().map((hotel) => ({ hotel }));
}

export async function generateMetadata(props: LayoutProps<'/h/[hotel]'>): Promise<Metadata> {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) return {};

  return {
    title: hotel.name,
    appleWebApp: { capable: true, title: hotel.shortName, statusBarStyle: 'black-translucent' },
    manifest: `/h/${hotel.slug}/manifest.webmanifest`,
  };
}

export default async function HotelLayout(props: LayoutProps<'/h/[hotel]'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return (
    <div style={{ '--rb-hotel': hotel.accent } as CSSProperties} className="relative min-h-dvh bg-bg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden lg:block"
        style={{
          backgroundImage: 'radial-gradient(50% 40% at 50% 0%, color-mix(in oklab, var(--rb-hotel) 8%, transparent), transparent)',
        }}
      />
      <GuestProviders hotelId={hotel.id}>
        <div className="relative flex min-h-dvh flex-col">
          <AppBar hotel={hotel} />
          <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+24px)] pt-4">{props.children}</main>
          <BottomNav hotel={hotel} />
          <InstallPrompt hotel={hotel} />
          <SwRegistrar />
        </div>
      </GuestProviders>
    </div>
  );
}
