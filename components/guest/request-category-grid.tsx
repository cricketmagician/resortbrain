import { Sparkles, Droplets, ConciergeBell, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { RequestCategory } from '@/lib/guest/types';

// Shared with RequestCard and order/request tracking so a category always reads the same icon.
export const REQUEST_CATEGORY_ICON: Record<RequestCategory, LucideIcon> = {
  housekeeping: Sparkles,
  amenities: Droplets,
  front_desk: ConciergeBell,
  maintenance: Wrench,
};

const CATEGORIES: { key: RequestCategory; icon: LucideIcon; label: string; hint: string }[] = [
  { key: 'housekeeping', icon: Sparkles, label: GUEST_COPY.request.category.housekeeping, hint: GUEST_COPY.home.quick.hints.housekeeping },
  { key: 'amenities', icon: Droplets, label: GUEST_COPY.request.category.amenities, hint: GUEST_COPY.home.quick.hints.amenities },
  { key: 'front_desk', icon: ConciergeBell, label: GUEST_COPY.request.category.front_desk, hint: GUEST_COPY.home.quick.hints.frontDesk },
  { key: 'maintenance', icon: Wrench, label: GUEST_COPY.request.category.maintenance, hint: GUEST_COPY.home.quick.hints.maintenance },
];

export function RequestCategoryGrid({
  selected,
  onSelect,
}: {
  selected: RequestCategory | null;
  onSelect: (category: RequestCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={GUEST_COPY.request.title}>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selected === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            aria-pressed={isSelected}
            data-testid={GUEST_TID.requestCategory(cat.key)}
            className={cn(
              'flex h-[112px] flex-col justify-between rounded-lg border p-3 text-left transition-colors focus-ring',
              isSelected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong'
            )}
          >
            <Icon aria-hidden className="size-5 text-accent" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-ink">{cat.label}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">{cat.hint}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
