import { NextResponse } from 'next/server';
import { getPublicHotel, listHotelSlugs } from '@/lib/guest/server/hotels';

// The per-hotel guest PWA manifest (docs/m2/06 §1) — start_url and scope keep the installed app
// pinned to this one hotel, so a guest at Grand Azure never lands on Heritage Palace's home.
export function generateStaticParams() {
  return listHotelSlugs().map((hotel) => ({ hotel }));
}

export async function GET(_request: Request, props: { params: Promise<{ hotel: string }> }) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) return new NextResponse('Not found', { status: 404 });

  const manifest = {
    id: `/h/${hotel.slug}`,
    name: hotel.name,
    short_name: hotel.shortName,
    description: `In-room dining, requests and your bill — ${hotel.name}`,
    start_url: `/h/${hotel.slug}`,
    scope: `/h/${hotel.slug}`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070B14',
    theme_color: '#070B14',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'In-room dining', url: `/h/${hotel.slug}/menu` },
      { name: 'Make a request', url: `/h/${hotel.slug}/request` },
      { name: 'Your bill', url: `/h/${hotel.slug}/bill` },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
