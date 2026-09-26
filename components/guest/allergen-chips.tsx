import { Wheat, Milk, Egg, Nut, Shell, Fish, type LucideIcon } from 'lucide-react';
import { GUEST_COPY } from '@/lib/guest/copy';

const ALLERGEN_ICONS: Record<string, LucideIcon> = {
  Gluten: Wheat,
  Dairy: Milk,
  Eggs: Egg,
  Nuts: Nut,
  Shellfish: Shell,
  Fish: Fish,
  Sesame: Nut,
};

export function AllergenChips({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) {
    return <p className="text-sm text-ink-subtle">{GUEST_COPY.item.noAllergens}</p>;
  }

  return (
    <div>
      <span className="sr-only">{GUEST_COPY.item.allergens(allergens.join(', '))}</span>
      <p aria-hidden className="flex flex-wrap items-center gap-1.5">
        {allergens.map((allergen) => {
          const Icon = ALLERGEN_ICONS[allergen] ?? Wheat;
          return (
            <span key={allergen} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-ink-muted">
              <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
              {allergen}
            </span>
          );
        })}
      </p>
    </div>
  );
}
