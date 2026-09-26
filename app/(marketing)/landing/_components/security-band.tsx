import { ShieldCheck, Calculator, RefreshCcw, FileClock } from 'lucide-react';
import { LANDING_COPY } from '../_content/landing-copy';

const ICONS = [ShieldCheck, Calculator, RefreshCcw, FileClock];

export function SecurityBand() {
  const { security } = LANDING_COPY;

  return (
    <section id="security" className="border-y border-line bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center font-display text-display-lg text-ink">{security.title}</h2>
        <div className="mt-12 flex flex-col gap-6">
          {security.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item} className="flex items-start gap-4 rounded-lg border border-line bg-surface-2 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <p className="pt-2 text-sm text-ink-muted">{item}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
