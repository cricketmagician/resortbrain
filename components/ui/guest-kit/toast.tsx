'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE_BAR: Record<ToastTone, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-info',
  warning: 'bg-warning',
};

const TONE_ICON_COLOR: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
};

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const schedule = React.useCallback(
    (id: string, duration: number) => {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const show = React.useCallback(
    (input: ToastInput) => {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `toast_${Date.now()}_${Math.random()}`;
      const tone = input.tone ?? 'info';
      const durationMs = input.durationMs ?? (tone === 'error' ? 6000 : 4000);
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...input, tone, durationMs, id }]);
      schedule(id, durationMs);
      return id;
    },
    [schedule]
  );

  function pause(id: string) {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  function resume(id: string, duration: number) {
    schedule(id, duration);
  }

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] z-50 mx-auto flex w-full max-w-[480px] flex-col gap-2 px-4">
        {toasts.map((t) => {
          const tone = t.tone ?? 'info';
          const Icon = TONE_ICON[tone];
          const duration = t.durationMs ?? 4000;
          return (
            <div
              key={t.id}
              role={tone === 'error' ? 'alert' : 'status'}
              aria-live={tone === 'error' ? 'assertive' : 'polite'}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id, duration)}
              onFocus={() => pause(t.id)}
              onBlur={() => resume(t.id, duration)}
              className="animate-rise pointer-events-auto flex overflow-hidden rounded-lg border border-line bg-surface-2 shadow-rb-2"
            >
              <span className={cn('w-1 shrink-0', TONE_BAR[tone])} aria-hidden />
              <div className="flex flex-1 items-start gap-2.5 py-3 pl-3 pr-2">
                <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', TONE_ICON_COLOR[tone])} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-1.5 rounded text-sm font-semibold text-accent focus-ring"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-ink-subtle hover:text-ink focus-ring"
                >
                  <X aria-hidden className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
