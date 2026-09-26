import { QrCode } from 'lucide-react';
import { StatusTimeline } from '@/components/ui/guest-kit/status-timeline';
import { menuForHotel } from '@/mock/guest/fixtures';
import { LANDING_COPY } from '../_content/landing-copy';
import { StaticMenuItemCard } from './static-menu-item';

const SHOWCASE_ITEM = menuForHotel('hotel-001').find((item) => item.id === 'item-002')!;

const DEMO_STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'preparing', label: 'Being prepared' },
  { key: 'delivered', label: 'Delivered' },
];

function StepVisual({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-line bg-surface-2">
        <span className="grid size-20 place-items-center rounded-2xl border-2 border-accent/40 bg-accent-soft">
          <QrCode aria-hidden className="size-10 text-accent" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (step === 2) {
    // inert, not just aria-hidden: the preview card renders real buttons that would otherwise
    // still catch keyboard focus even though assistive tech can't see them.
    return (
      <div aria-hidden inert className="pointer-events-none select-none rounded-lg border border-line bg-surface-2 p-3">
        <StaticMenuItemCard item={SHOWCASE_ITEM} layout="row" />
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-5">
      <StatusTimeline steps={DEMO_STEPS} currentKey="preparing" timeZone="Asia/Kolkata" orientation="vertical" />
    </div>
  );
}

export function HowItWorks() {
  const { howItWorks } = LANDING_COPY;

  return (
    <section id="how" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-display-lg text-ink">{howItWorks.title}</h2>
        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {howItWorks.steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <span className="font-display text-4xl text-accent">{step.number}</span>
              <h3 className="font-display text-xl text-ink">{step.title}</h3>
              <p className="text-sm text-ink-muted">{step.body}</p>
              <StepVisual step={Number(step.number)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
