'use client';

import { AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';

export function DelayNotice({ message, onDismiss, testId }: { message: string; onDismiss: () => void; testId?: string }) {
  return (
    <Card tone="outline" data-testid={testId} className="flex items-start gap-3 border-warning/40! bg-warning-soft! p-4">
      <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" strokeWidth={1.75} />
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-8 shrink-0 place-items-center rounded-full text-ink-subtle hover:text-ink focus-ring"
      >
        <X aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </Card>
  );
}
