'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/guest-kit/input';
import { NumberStepper } from '@/components/ui/guest-kit/input';
import { Button } from '@/components/ui/guest-kit/button';
import { PlateTile } from '@/components/ui/guest-kit/menu-item-card';
import { VegMark } from './veg-mark';
import { AllergenChips } from './allergen-chips';
import { ResilientImage } from './resilient-image';
import { formatMoney } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { MenuItemVM } from '@/lib/guest/types';

export interface ItemDetailProps {
  item: MenuItemVM;
  quantity: number;
  canOrder: boolean;
  note: string;
  onAdd: () => void;
  onChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
}

// Renders in two containers (docs/m2/04 §5): the menu's item sheet, and the standalone SSG page.
export function ItemDetail({ item, quantity, canOrder, note, onAdd, onChange, onNoteChange }: ItemDetailProps) {
  const [localNote, setLocalNote] = useState(note);
  const inCart = quantity > 0;

  function commitNote(value: string) {
    setLocalNote(value);
    onNoteChange(value);
  }

  return (
    <div data-testid={GUEST_TID.itemDetail} className="flex flex-col gap-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-surface-3">
        {item.imageUrl ? (
          <ResilientImage src={item.imageUrl} alt={item.name} fill sizes="480px" className="object-cover" />
        ) : (
          <PlateTile name={item.name} category={item.category} className="absolute inset-0" />
        )}
      </div>

      <div>
        <div className="flex items-start gap-2">
          <VegMark isVeg={item.isVeg} className="mt-1.5" />
          <h2 className="min-w-0 font-display text-display-md text-ink">{item.name}</h2>
        </div>
        <p className="mt-1 tabular font-semibold text-accent">{GUEST_COPY.item.each(formatMoney(item.pricePaise, item.currency))}</p>
      </div>

      {item.description && <p className="text-sm text-ink-muted">{item.description}</p>}

      <AllergenChips allergens={item.allergens} />

      {canOrder && (
        <div>
          <label htmlFor={`item-note-${item.id}`} className="text-sm font-medium text-ink">
            {GUEST_COPY.item.note.label}
          </label>
          <div data-testid={GUEST_TID.itemNote} className="mt-1.5">
            <Input
              id={`item-note-${item.id}`}
              value={localNote}
              onChange={(e) => commitNote(e.target.value.slice(0, 120))}
              placeholder={GUEST_COPY.item.note.placeholder}
              maxLength={120}
            />
          </div>
        </div>
      )}

      <div className="sticky -bottom-4 -mx-5 -mb-4 flex items-center gap-3 border-t border-line bg-surface px-5 py-4">
        {!canOrder ? (
          <Button variant="secondary" size="lg" fullWidth disabled data-testid={GUEST_TID.itemAdd}>
            {GUEST_COPY.menu.scanToOrder}
          </Button>
        ) : (
          <>
            <span data-testid={GUEST_TID.itemQty}>
              <NumberStepper value={quantity} onChange={onChange} label={item.name} />
            </span>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (!inCart) onAdd();
              }}
              data-testid={GUEST_TID.itemAdd}
            >
              {inCart ? GUEST_COPY.item.update : GUEST_COPY.item.add}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
