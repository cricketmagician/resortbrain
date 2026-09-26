import { Palmtree, Building2, Landmark, BedDouble } from 'lucide-react';
import { LANDING_COPY } from '../_content/landing-copy';

const ICONS = [Palmtree, Building2, Landmark, BedDouble];

export function BuiltFor() {
  const { builtFor } = LANDING_COPY;

  return (
    <section className="border-y border-line py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-eyebrow font-semibold uppercase tracking-wide text-ink-subtle">
          {builtFor.title}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {builtFor.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item} className="flex flex-col items-center gap-2 text-center">
                <Icon aria-hidden className="size-6 text-ink-subtle" strokeWidth={1.5} />
                <span className="text-sm text-ink-muted">{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
