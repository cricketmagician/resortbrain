'use client';

import * as React from 'react';
import Image from 'next/image';
import { Sandwich, Beef, Soup, Coffee, CakeSlice, Salad, Fish, IceCreamCone, CupSoda, Flame } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/guest/format';
import { Card } from './card';
import { Button } from './button';
import { NumberStepper } from './input';

// ---------------------------------------------------------------------------
// VegMark — the FSSAI-style veg / non-veg indicator, shared by the menu, cart,
// item detail, bill and receipt. Lives here because it's part of the menu
// item's visual vocabulary; components/guest/veg-mark.tsx re-exports it.
// ---------------------------------------------------------------------------

export function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cn('inline-grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px] bg-white', isVeg ? 'border-veg' : 'border-nonveg', className)}
    >
      {isVeg ? (
        <span className="size-1.5 rounded-full bg-veg" />
      ) : (
        <span className="size-0 border-x-[3px] border-b-[5px] border-x-transparent border-b-nonveg" />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// PlateTile — the designed fallback for menu items without a photo (docs/m2/07 §3).
// Deterministic per category so the same dish always renders the same tile.
// ---------------------------------------------------------------------------

const GRADIENTS = [
  'linear-gradient(135deg, var(--rb-surface-3), var(--rb-surface-1))',
  'linear-gradient(135deg, color-mix(in oklab, var(--rb-hotel) 22%, var(--rb-surface-2)), var(--rb-surface-1))',
  'linear-gradient(135deg, color-mix(in oklab, var(--rb-accent) 18%, var(--rb-surface-2)), var(--rb-surface-1))',
  'linear-gradient(160deg, var(--rb-surface-2), color-mix(in oklab, var(--rb-hotel) 14%, var(--rb-surface-3)))',
  'linear-gradient(160deg, color-mix(in oklab, var(--rb-success) 10%, var(--rb-surface-2)), var(--rb-surface-1))',
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function CategoryGlyph({ category, name, className }: { category: string; name: string; className?: string }) {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  const glyphProps = { 'aria-hidden': true as const, className, strokeWidth: 1.25 };

  if (/salmon|prawn|fish|lobster/.test(n)) return <Fish {...glyphProps} />;
  if (/kulfi|ice cream/.test(n)) return <IceCreamCone {...glyphProps} />;
  if (c.includes('tandoor')) return <Flame {...glyphProps} />;
  if (c.includes('grill')) return <Beef {...glyphProps} />;
  if (c.includes('beverage') || c.includes('mixology')) return <CupSoda {...glyphProps} />;
  if (c.includes('chai') || c.includes('coffee') || c.includes('brew')) return <Coffee {...glyphProps} />;
  if (c.includes('dessert') || c.includes('mithai')) return <CakeSlice {...glyphProps} />;
  if (c.includes('feast') || c.includes('classic')) return <Soup {...glyphProps} />;
  if (c.includes('dining')) return <Sandwich {...glyphProps} />;
  return <Salad {...glyphProps} />;
}

export function PlateTile({ name, category, className }: { name: string; category: string; className?: string }) {
  const gradient = GRADIENTS[hashString(category || name) % GRADIENTS.length];
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)} style={{ backgroundImage: gradient }}>
      <CategoryGlyph category={category} name={name} className="absolute size-10 text-ink-subtle/30" />
      <span className="relative font-display text-3xl text-ink/70">{initial}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenuItemCard
// ---------------------------------------------------------------------------

export interface MenuItemCardData {
  id: string;
  name: string;
  description?: string;
  category: string;
  pricePaise: number;
  currency: string;
  imageUrl?: string;
  isVeg: boolean;
  allergens: string[];
  available: boolean;
}

export interface MenuItemCardProps {
  item: MenuItemCardData;
  layout?: 'row' | 'feature';
  quantity: number;
  canOrder: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  priority?: boolean;
  className?: string;
}

export function MenuItemCard({
  item,
  layout = 'row',
  quantity,
  canOrder,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement,
  priority,
  className,
}: MenuItemCardProps) {
  const visibleAllergens = item.allergens.slice(0, 2);
  const extraCount = item.allergens.length - visibleAllergens.length;

  function stop(action: () => void) {
    return (e: React.SyntheticEvent) => {
      e.stopPropagation();
      action();
    };
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  }

  const media = item.imageUrl ? (
    <Image
      src={item.imageUrl}
      alt={item.name}
      fill
      priority={priority}
      sizes={layout === 'row' ? '96px' : '(min-width: 768px) 33vw, 90vw'}
      className="object-cover"
    />
  ) : (
    <PlateTile name={item.name} category={item.category} className="absolute inset-0" />
  );

  const addControl = !item.available ? (
    <span className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-medium text-ink-subtle">Unavailable right now</span>
  ) : !canOrder ? (
    <Button variant="secondary" size="md" onClick={stop(onOpen)} data-testid={`menu-add-${item.id}`}>
      View
    </Button>
  ) : quantity > 0 ? (
    <span onClick={(e) => e.stopPropagation()} data-testid={`menu-qty-${item.id}`}>
      <NumberStepper value={quantity} label={item.name} size="sm" onChange={(next) => (next > quantity ? onIncrement() : onDecrement())} />
    </span>
  ) : (
    <Button variant="primary" size="md" onClick={stop(onAdd)} data-testid={`menu-add-${item.id}`}>
      Add
    </Button>
  );

  const sharedProps = {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: handleKeyDown,
    'data-testid': `menu-item-${item.id}`,
    'aria-label': `${item.name}, ${formatMoney(item.pricePaise, item.currency)}`,
  };

  if (layout === 'feature') {
    return (
      <Card as="article" tone="raised" interactive className={cn('flex w-60 shrink-0 flex-col overflow-hidden', className)} {...sharedProps}>
        <div className="relative aspect-[16/10] w-full bg-surface-3">{media}</div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start gap-2">
            <VegMark isVeg={item.isVeg} className="mt-1.5" />
            <h3 className="line-clamp-1 min-w-0 flex-1 font-display text-lg text-ink">{item.name}</h3>
          </div>
          {item.description && <p className="line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="tabular font-semibold text-accent">{formatMoney(item.pricePaise, item.currency)}</span>
            {addControl}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card as="article" tone="default" className={cn('flex items-start gap-3 rounded-none border-x-0 border-t-0 p-0 py-4 shadow-none', className)} {...sharedProps}>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <VegMark isVeg={item.isVeg} className="mt-1.5" />
          <h3 className="min-w-0 flex-1 font-display text-lg text-ink">{item.name}</h3>
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
        {visibleAllergens.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {visibleAllergens.map((a) => (
              <span key={a} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-subtle">
                {a}
              </span>
            ))}
            {extraCount > 0 && <span className="text-xs text-ink-subtle">+{extraCount}</span>}
          </div>
        )}
        <p className="mt-2 tabular font-semibold text-accent">{formatMoney(item.pricePaise, item.currency)}</p>
      </div>
      <div className="relative shrink-0 pb-3">
        <div className="relative size-24 overflow-hidden rounded-lg bg-surface-3">{media}</div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">{addControl}</div>
      </div>
    </Card>
  );
}
