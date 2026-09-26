'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { StatusTimeline } from '@/components/ui/guest-kit/status-timeline';
import { LANDING_COPY } from '../_content/landing-copy';

const LOOP_STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Being prepared' },
  { key: 'delivered', label: 'Delivered' },
];

const STEP_MS = 1500;

export function HeroPhone() {
  const [index, setIndex] = useState(LOOP_STEPS.length - 1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    // matchMedia can't be read during SSR, so both states start conservatively "reduced" above
    // and this corrects them once real preference is known — a legitimate one-time exception to
    // "don't setState synchronously in an effect", not state that render could compute itself.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    /* eslint-disable react-hooks/set-state-in-effect */
    setReduceMotion(query.matches);
    setIndex(query.matches ? LOOP_STEPS.length - 1 : 0);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % LOOP_STEPS.length), STEP_MS);
    return () => clearInterval(interval);
  }, [reduceMotion, paused]);

  const currentKey = LOOP_STEPS[index].key;

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="relative rounded-[44px] border border-line-strong bg-surface p-3 shadow-rb-3">
        <div className="rounded-[32px] bg-bg px-5 py-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full border border-hotel/40 font-display text-xs text-hotel">GA</span>
            <span className="font-display text-sm text-ink">Grand Azure</span>
          </div>
          <StatusTimeline
            steps={LOOP_STEPS.map((s) => ({ key: s.key, label: s.label }))}
            currentKey={currentKey}
            timeZone="Asia/Kolkata"
            orientation="horizontal"
            live={!reduceMotion && !paused}
          />
        </div>
      </div>

      <div className="animate-rise absolute -left-6 top-8 hidden w-44 rounded-lg border border-line bg-surface-2/95 p-3 shadow-rb-2 backdrop-blur sm:block">
        <div className="flex items-center gap-2">
          <Bell aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
          <p className="text-xs font-medium text-ink">{LANDING_COPY.hero.phone.newOrder}</p>
        </div>
      </div>

      <div className="animate-rise absolute -right-6 bottom-14 hidden w-40 rounded-lg border border-line bg-surface-2/95 p-3 shadow-rb-2 backdrop-blur sm:block">
        <div className="flex items-center gap-2">
          <Check aria-hidden className="size-4 shrink-0 text-success" strokeWidth={1.75} />
          <p className="text-xs font-medium text-ink">{LANDING_COPY.hero.phone.delivered}</p>
        </div>
      </div>

      {!reduceMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play the order status animation' : 'Pause the order status animation'}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs text-ink-muted focus-ring"
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      )}
    </div>
  );
}
