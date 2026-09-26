import { Sparkles, PackageSearch, Plug, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { LANDING_COPY } from '../_content/landing-copy';

const ICONS = [Sparkles, PackageSearch, Plug, Wallet];

export function Roadmap() {
  const { roadmap } = LANDING_COPY;

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span className="inline-block rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
          {roadmap.badge}
        </span>
        <h2 className="mt-4 max-w-xl font-display text-display-lg text-ink">{roadmap.title}</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roadmap.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Card key={item} tone="outline" className="p-5">
                <Icon aria-hidden className="size-5 text-ink-subtle" strokeWidth={1.75} />
                <p className="mt-3 text-sm font-medium text-ink-muted">{item}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
