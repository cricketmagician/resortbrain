import { Check } from 'lucide-react';
import { Button } from '@/components/ui/guest-kit/button';
import { LANDING_COPY } from '../_content/landing-copy';
import { HeroPhone } from './hero-phone';

const DEMO_QR_TOKEN = process.env.NEXT_PUBLIC_DEMO_QR_TOKEN ?? 'QR_AZURE_304';

export function Hero() {
  const { hero } = LANDING_COPY;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 80% 10%, color-mix(in oklab, var(--rb-accent) 12%, transparent), transparent), linear-gradient(var(--rb-line) 1px, transparent 1px), linear-gradient(90deg, var(--rb-line) 1px, transparent 1px)',
          backgroundSize: 'auto, 32px 32px, 32px 32px',
          maskImage: 'radial-gradient(80% 60% at 50% 0%, black, transparent)',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 md:min-h-[88svh] md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-eyebrow font-semibold uppercase tracking-wide text-accent">
            {hero.eyebrow}
          </span>
          <h1 className="mt-5 max-w-xl font-display text-display-xl text-ink">{hero.heading}</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-muted">{hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/q/${DEMO_QR_TOKEN}`} variant="primary" size="lg" data-testid="landing-hero-cta">
              {hero.ctaPrimary}
            </Button>
            <Button href="#how" variant="secondary" size="lg">
              {hero.ctaSecondary}
            </Button>
          </div>
          <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-6">
            {hero.proof.map((line) => (
              <li key={line} className="flex items-center gap-2 text-sm text-ink-muted">
                <Check aria-hidden className="size-4 shrink-0 text-success" strokeWidth={2} />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:pl-8">
          <HeroPhone />
        </div>
      </div>
    </section>
  );
}
