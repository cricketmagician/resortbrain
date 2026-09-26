import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

// The landing page is always dark, even after a guest has switched a hotel to Sunlight mode
// (docs/m2/README "decisions already made" #1) — data-theme + .dark are set here regardless of
// the rb-theme cookie the root layout's boot script reads.
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div data-theme="dark" className="dark min-h-dvh bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to content
      </a>
      <MarketingHeader />
      <main id="main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
