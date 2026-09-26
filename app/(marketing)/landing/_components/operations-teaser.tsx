import { ChefHat, BellRing, TimerReset, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { LANDING_COPY } from '../_content/landing-copy';

const ICONS = [ChefHat, BellRing, TimerReset, LayoutDashboard];

export function OperationsTeaser() {
  const { forTeams } = LANDING_COPY;

  return (
    <section id="teams" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <h2 className="max-w-xl font-display text-display-lg text-ink">{forTeams.title}</h2>
          <Button href="/pricing" variant="secondary" size="md">
            {forTeams.cta} →
          </Button>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {forTeams.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Card key={item.title} tone="outline" className="p-6">
                <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
