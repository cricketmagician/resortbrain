import Link from 'next/link';
import { Button } from '@/components/ui/guest-kit/button';
import { LANDING_COPY } from '@/app/(marketing)/landing/_content/landing-copy';
import { MobileNav } from './mobile-nav';

const DEMO_QR_TOKEN = process.env.NEXT_PUBLIC_DEMO_QR_TOKEN ?? 'QR_AZURE_304';

export function MarketingHeader() {
  const { header } = LANDING_COPY;

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-md">
          <span className="grid size-8 place-items-center rounded-full border border-accent/40 bg-accent-soft font-display text-sm text-accent">
            RB
          </span>
          <span className="font-display text-lg text-ink">{header.wordmark}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {header.nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
              {item.label}
            </a>
          ))}
          <Link href={header.pricing.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
            {header.pricing.label}
          </Link>
        </nav>

        <div className="hidden md:block">
          <Button href={`/q/${DEMO_QR_TOKEN}`} variant="primary" size="md">
            {header.cta}
          </Button>
        </div>

        <MobileNav navItems={header.nav} pricing={header.pricing} cta={header.cta} demoHref={`/q/${DEMO_QR_TOKEN}`} />
      </div>
    </header>
  );
}
