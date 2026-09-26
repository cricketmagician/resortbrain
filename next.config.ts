import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/guest',
        has: [
          {
            type: 'query',
            key: 'qr',
            value: '(?<token>.*)',
          },
        ],
        destination: '/q/:token',
        permanent: false,
      },
      {
        source: '/guest',
        has: [
          {
            type: 'query',
            key: 'hotel',
            value: '(?<slug>.*)',
          },
        ],
        destination: '/h/:slug',
        permanent: false,
      },
      {
        source: '/guest',
        destination: '/h/grand-azure',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
