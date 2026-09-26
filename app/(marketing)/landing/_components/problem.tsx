import { Zap, Smartphone, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { LANDING_COPY } from '../_content/landing-copy';

const ICONS = [Zap, Smartphone, ShieldCheck];

export function Problem() {
  const { problem } = LANDING_COPY;

  return (
    <section id="product" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-display-lg text-ink">{problem.title}</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {problem.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Card key={item.problem} tone="default" className="flex flex-col gap-4 p-6">
                <p className="text-sm text-ink-subtle">{item.problem}</p>
                <p className="text-sm text-ink-subtle">{item.problemBody}</p>
                <div className="mt-2 h-px bg-line" />
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-lg text-ink">{item.answer}</p>
                    <p className="mt-1 text-sm text-ink-muted">{item.answerBody}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
