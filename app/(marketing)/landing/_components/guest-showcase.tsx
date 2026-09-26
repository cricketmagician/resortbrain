import { Smartphone, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { StatusTimeline } from '@/components/ui/guest-kit/status-timeline';
import { menuForHotel } from '@/mock/guest/fixtures';
import { formatMoney } from '@/lib/guest/format';
import { LANDING_COPY } from '../_content/landing-copy';
import { StaticMenuItemCard } from './static-menu-item';

const SHOWCASE_ITEMS = menuForHotel('hotel-001').filter((item) => ['item-002', 'item-003'].includes(item.id));

const STATUS_STEPS = [
  { key: 'placed', label: 'Order placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Being prepared' },
  { key: 'ready', label: 'Ready' },
];

export function GuestShowcase() {
  const { forGuests } = LANDING_COPY;
  const [branded, live, requests, bill, installable, wifi] = forGuests.items;

  return (
    <section id="guests" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-display-lg text-ink">{forGuests.title}</h2>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card tone="raised" className="p-6 md:col-span-4">
            <h3 className="font-display text-lg text-ink">{branded.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{branded.body}</p>
            <div aria-hidden className="pointer-events-none mt-5 grid select-none grid-cols-1 gap-4 sm:grid-cols-2">
              {SHOWCASE_ITEMS.map((item) => (
                <StaticMenuItemCard key={item.id} item={item} layout="feature" />
              ))}
            </div>
          </Card>

          <Card tone="raised" className="p-6 md:col-span-2">
            <h3 className="font-display text-lg text-ink">{live.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{live.body}</p>
            <div className="mt-5">
              <StatusTimeline steps={STATUS_STEPS} currentKey="preparing" timeZone="Asia/Kolkata" live />
            </div>
          </Card>

          <Card tone="raised" className="p-6 md:col-span-2">
            <h3 className="font-display text-lg text-ink">{requests.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{requests.body}</p>
            <div aria-hidden className="pointer-events-none mt-5 flex select-none flex-wrap gap-2">
              {['Extra towels', 'Turndown', 'Book a taxi'].map((label) => (
                <Button key={label} variant="chip" size="md">
                  {label}
                </Button>
              ))}
            </div>
          </Card>

          <Card tone="raised" className="p-6 md:col-span-2">
            <h3 className="font-display text-lg text-ink">{bill.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{bill.body}</p>
            <div aria-hidden className="mt-5 select-none rounded-md border border-line bg-surface-2 p-3 font-mono text-xs text-ink-muted">
              <div className="flex justify-between">
                <span>Avocado Tartine</span>
                <span className="tabular">{formatMoney(55000)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Coconut Water ×2</span>
                <span className="tabular">{formatMoney(50000)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-ink">
                <span>Total</span>
                <span className="tabular">{formatMoney(129150)}</span>
              </div>
            </div>
          </Card>

          <Card tone="raised" className="p-6 md:col-span-2">
            <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
              <Smartphone aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-3 font-display text-lg text-ink">{installable.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{installable.body}</p>
          </Card>

          <Card tone="raised" className="p-6 md:col-span-4">
            <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
              <Wifi aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-3 font-display text-lg text-ink">{wifi.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{wifi.body}</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
