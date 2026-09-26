'use client';

import { useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GUEST_TID } from './test-ids';

const RATINGS = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATINGS)[number];

export function StarRating({ value, onChange }: { value: number; onChange: (rating: Rating) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function select(n: Rating) {
    onChange(n);
    buttonRefs.current[n - 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, n: Rating) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(Math.min(5, n + 1) as Rating);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      select(Math.max(1, n - 1) as Rating);
    }
  }

  const activeValue = value || 1;

  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {RATINGS.map((n) => {
        const filled = (hovered ?? value) >= n;
        return (
          <button
            key={n}
            ref={(el) => {
              buttonRefs.current[n - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            tabIndex={activeValue === n ? 0 : -1}
            onClick={() => select(n)}
            onKeyDown={(e) => handleKeyDown(e, n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            data-testid={GUEST_TID.feedbackStar(n)}
            className="grid size-11 shrink-0 place-items-center rounded-full focus-ring"
          >
            <Star aria-hidden className={cn('size-6', filled ? 'fill-accent text-accent' : 'text-line-strong')} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
