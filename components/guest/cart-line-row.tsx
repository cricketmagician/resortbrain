'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { NumberStepper, Input } from '@/components/ui/guest-kit/input';
import { VegMark } from './veg-mark';
import { formatMoney } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { MenuItemVM } from '@/lib/guest/types';

export interface CartLineRowProps {
  item: MenuItemVM;
  quantity: number;
  note: string;
  onQtyChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
}

// One line in <CartView> (docs/m2/04 §6): a stepper up top, and a tappable note affordance below
// it that swaps to an <Input> in place — same 120-char cap as the item sheet's note field.
export function CartLineRow({ item, quantity, note, onQtyChange, onNoteChange }: CartLineRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  function commit() {
    const trimmed = draft.trim();
    setDraft(trimmed);
    onNoteChange(trimmed);
    setEditing(false);
  }

  return (
    <li data-testid={GUEST_TID.cartLine(item.id)} className="flex flex-col gap-2 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2 pt-1.5">
          <VegMark isVeg={item.isVeg} className="mt-1" />
          <span className="min-w-0 truncate font-medium text-ink">{item.name}</span>
        </div>
        <NumberStepper value={quantity} onChange={onQtyChange} label={item.name} size="sm" />
      </div>

      <div className="flex items-center gap-2 pl-[26px] text-sm text-ink-muted">
        <span className="shrink-0 tabular">{GUEST_COPY.item.each(formatMoney(item.pricePaise, item.currency))}</span>
        {!editing && (
          <>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => {
                setDraft(note);
                setEditing(true);
              }}
              className="inline-flex min-w-0 items-center gap-1 rounded text-ink-muted transition-colors hover:text-ink focus-ring"
            >
              <span className="truncate">{note ? `"${note}"` : GUEST_COPY.item.note.add}</span>
              <Pencil aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {editing && (
        <div className="pl-[26px]">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 120))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder={GUEST_COPY.item.note.placeholder}
            maxLength={120}
            aria-label={`${GUEST_COPY.item.note.label} — ${item.name}`}
          />
        </div>
      )}
    </li>
  );
}
