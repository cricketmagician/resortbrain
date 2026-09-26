import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'ResortBrain', template: '%s · ResortBrain' },
  description: 'Hospitality at the speed of a scan — in-room dining, requests and billing for modern hotels.',
};

export const viewport: Viewport = {
  themeColor: '#070B14',
  colorScheme: 'dark light',
  viewportFit: 'cover',
};

// Reads the guest's stored theme before paint, so there's no flash on load. Falls back to the
// rb-theme cookie when localStorage is empty, and keeps both data-theme and the .dark class in
// sync since M1's styles key off .dark while the shared tokens key off data-theme.
const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('rb-theme');if(!t){var m=document.cookie.match(/(?:^|; )rb-theme=([^;]*)/);if(m)t=decodeURIComponent(m[1])}if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark')}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="dark" className={`dark ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
