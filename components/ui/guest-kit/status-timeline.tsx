import * as React from 'react';
import { Check, AlertTriangle, Ban } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/guest/format';
import type { TimelineStep, TerminalStep } from '@/lib/guest/status';

export interface StatusTimelineProps {
  steps: TimelineStep[];
  currentKey: string | null;
  terminal?: TerminalStep;
  orientation?: 'vertical' | 'horizontal';
  timeZone: string;
  live?: boolean;
  announce?: boolean;
  /** data-testid applied to the <ol> so pages can expose the E2E contract (docs/m2/06 §7). */
  testId?: string;
  /** data-testid applied to whichever row is currently active. */
  currentTestId?: string;
}

export function StatusTimeline({
  steps,
  currentKey,
  terminal,
  orientation = 'vertical',
  timeZone,
  live,
  announce,
  testId,
  currentTestId,
}: StatusTimelineProps) {
  const currentIndex = currentKey ? steps.findIndex((s) => s.key === currentKey) : -1;
  const announceText = currentIndex >= 0 ? `Your order is now ${steps[currentIndex].label.toLowerCase()}` : terminal?.label;
  const isVertical = orientation === 'vertical';

  return (
    <div>
      {announce && (
        <span className="sr-only" role="status" aria-live="polite">
          {announceText}
        </span>
      )}
      <ol data-testid={testId} className={cn('flex', isVertical ? 'flex-col' : 'flex-row items-start')}>
        {steps.map((step, i) => {
          const isDone = currentIndex >= 0 ? i < currentIndex : !!terminal;
          const isCurrent = i === currentIndex;
          const isLastVisible = i === steps.length - 1 && !terminal;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? 'step' : undefined}
              data-status={isCurrent ? step.key : undefined}
              data-testid={isCurrent ? currentTestId : undefined}
              className={cn(
                'relative flex',
                isVertical ? 'flex-1 gap-3 pb-6 last:pb-0' : 'flex-1 flex-col items-center gap-2 px-1 text-center'
              )}
            >
              {isVertical && !isLastVisible && (
                <span
                  aria-hidden
                  className={cn('absolute left-[11px] top-6 h-[calc(100%-8px)] w-px transition-colors', isDone ? 'bg-success' : 'bg-line')}
                />
              )}
              {!isVertical && i < steps.length - 1 && (
                <span aria-hidden className={cn('absolute left-1/2 top-3 h-px w-full transition-colors', isDone ? 'bg-success' : 'bg-line')} />
              )}
              <span
                aria-hidden
                className={cn(
                  'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 bg-bg transition-colors',
                  isDone && 'border-success bg-success text-white',
                  isCurrent && !isDone && 'border-accent text-accent',
                  !isDone && !isCurrent && 'border-line text-transparent',
                  isCurrent && live && 'animate-pulse-ring'
                )}
              >
                {isDone && <Check className="size-3.5" strokeWidth={2.5} />}
              </span>
              <span className={cn('flex min-w-0 flex-1 items-baseline justify-between gap-2', !isVertical && 'flex-col items-center')}>
                <span className="min-w-0">
                  <span className={cn('block text-sm', isCurrent ? 'font-semibold text-ink' : isDone ? 'text-ink' : 'text-ink-subtle')}>
                    {step.label}
                  </span>
                  {isCurrent && step.hint && <span className="block text-xs text-ink-muted">{step.hint}</span>}
                </span>
                {step.at && <span className="shrink-0 text-sm tabular text-ink-subtle">{formatTime(step.at, timeZone)}</span>}
              </span>
            </li>
          );
        })}
        {terminal && (
          <li className="flex items-start gap-3 pt-2" data-status={terminal.key} data-testid={currentTestId}>
            <span
              aria-hidden
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border-2',
                terminal.tone === 'danger' ? 'border-danger bg-danger text-white' : 'border-line-strong bg-surface-2 text-ink-muted'
              )}
            >
              {terminal.tone === 'danger' ? <AlertTriangle className="size-3.5" strokeWidth={2.5} /> : <Ban className="size-3.5" strokeWidth={2.5} />}
            </span>
            <span>
              <span className={cn('block text-sm font-semibold', terminal.tone === 'danger' ? 'text-danger' : 'text-ink')}>{terminal.label}</span>
              {terminal.hint && <span className="block text-xs text-ink-muted">{terminal.hint}</span>}
              {terminal.at && <span className="block text-xs tabular text-ink-subtle">{formatTime(terminal.at, timeZone)}</span>}
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}

export type StatusPillTone = 'neutral' | 'progress' | 'success' | 'danger' | 'warning';

const PILL_TONE_CLASSES: Record<StatusPillTone, string> = {
  neutral: 'bg-surface-2 text-ink-muted border-line',
  progress: 'bg-accent-soft text-accent border-accent/30',
  success: 'bg-success-soft text-success border-success/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  warning: 'bg-warning-soft text-warning border-warning/30',
};

export interface StatusPillProps {
  tone: StatusPillTone;
  live?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ tone, live, children, className }: StatusPillProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', PILL_TONE_CLASSES[tone], className)}>
      {live && (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
