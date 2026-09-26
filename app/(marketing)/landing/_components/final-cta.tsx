import { Button } from '@/components/ui/guest-kit/button';
import { LANDING_COPY } from '../_content/landing-copy';

const DEMO_QR_TOKEN = process.env.NEXT_PUBLIC_DEMO_QR_TOKEN ?? 'QR_AZURE_304';

export function FinalCta() {
  const { finalCta } = LANDING_COPY;

  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-4xl rounded-2xl bg-cta px-8 py-16 text-center shadow-glow">
        <h2 className="font-display text-display-lg text-cta-ink">{finalCta.title}</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href={`/q/${DEMO_QR_TOKEN}`} variant="secondary" size="lg" className="bg-bg text-ink hover:bg-surface-2">
            {finalCta.ctaPrimary}
          </Button>
          <Button href="/pricing" variant="ghost" size="lg" className="text-cta-ink hover:bg-black/10">
            {finalCta.ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
