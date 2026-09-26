import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicHotel, listHotelSlugs } from '@/lib/guest/server/hotels';
import { GuestProviders } from '@/components/guest/guest-providers';
import { AppBar } from '@/components/guest/app-bar';
import { BottomNav } from '@/components/guest/bottom-nav';

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
        </div>
      </GuestProviders>
    </div>
  );
}
