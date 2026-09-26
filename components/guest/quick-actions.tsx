import Link from 'next/link';
import { UtensilsCrossed, Sparkles, Droplets, ConciergeBell, Receipt, ListChecks } from 'lucide-react';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';

const ACTIONS = [
  {
    key: 'dining',
    icon: UtensilsCrossed,
    href: (slug: string) => `/h/${slug}/menu`,
    label: GUEST_COPY.home.quick.dining,
    hint: GUEST_COPY.home.quick.hints.dining,
  },
  {
    key: 'housekeeping',
    icon: Sparkles,
    href: (slug: string) => `/h/${slug}/request?c=housekeeping`,
    label: GUEST_COPY.home.quick.housekeeping,
    hint: GUEST_COPY.home.quick.hints.housekeeping,
  },
  {
    key: 'amenities',
    icon: Droplets,
    href: (slug: string) => `/h/${slug}/request?c=amenities`,
    label: GUEST_COPY.home.quick.amenities,
    hint: GUEST_COPY.home.quick.hints.amenities,
  },
  {
    key: 'front_desk',
    icon: ConciergeBell,
    href: (slug: string) => `/h/${slug}/request?c=front_desk`,
    label: GUEST_COPY.home.quick.frontDesk,
    hint: GUEST_COPY.home.quick.hints.frontDesk,
  },
  {
    key: 'bill',
    icon: Receipt,
    href: (slug: string) => `/h/${slug}/bill`,
    label: GUEST_COPY.home.quick.bill,
    hint: GUEST_COPY.home.quick.hints.bill,
  },
  {
    key: 'activity',
    icon: ListChecks,
    href: (slug: string) => `/h/${slug}/activity`,
    label: GUEST_COPY.home.quick.activity,
    hint: GUEST_COPY.home.quick.hints.activity,
  },
] as const;

export function QuickActions({ hotelSlug }: { hotelSlug: string }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.key}
            href={action.href(hotelSlug)}
            prefetch
            data-testid={GUEST_TID.quick(action.key)}
            className="flex h-[104px] flex-col justify-between rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-strong focus-ring"
          >
            <Icon aria-hidden className="size-5 text-accent" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-ink">{action.label}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">{action.hint}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
