import type { MetadataRoute } from 'next';

// The generic ResortBrain manifest (docs/m2/06 §1). Guest pages point at their own per-hotel
// manifest instead (app/(guest)/h/[hotel]/manifest.webmanifest/route.ts); M3's staff layout may
// point at its own manifest too.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ResortBrain',
    short_name: 'ResortBrain',
    description: 'Multi-tenant hotel operations, from the front desk to the guest in room 304.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070B14',
    theme_color: '#070B14',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
