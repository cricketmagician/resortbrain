import Link from 'next/link';
import { LANDING_COPY } from '@/app/(marketing)/landing/_content/landing-copy';
import { TEAM_CREDITS } from '@/app/(marketing)/landing/_content/team';

export function MarketingFooter() {
  const { header, footer } = LANDING_COPY;

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full border border-accent/40 bg-accent-soft font-display text-sm text-accent">
              RB
            </span>
            <div>
              <p className="font-display text-lg text-ink">{header.wordmark}</p>
              <p className="text-sm text-ink-subtle">{footer.tagline}</p>
            </div>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {header.nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-ink-muted hover:text-ink">
                {item.label}
              </a>
            ))}
            <Link href={header.pricing.href} className="text-sm text-ink-muted hover:text-ink" data-testid="landing-nav-pricing">
              {header.pricing.label}
            </Link>
          </nav>
        </div>

        <div className="border-t border-line pt-6">
          <p className="text-sm text-ink-subtle">
            {footer.builtBy}{' '}
            {TEAM_CREDITS.map((member, i) => (
              <span key={member.name}>
                <span className="text-ink-muted">
                  {member.name} ({member.role})
                </span>
                {i < TEAM_CREDITS.length - 1 ? ' · ' : ''}
              </span>
            ))}
            .
          </p>
          <p className="mt-2 text-sm text-ink-subtle">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
