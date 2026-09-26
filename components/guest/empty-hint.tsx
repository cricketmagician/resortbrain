import { Button } from '@/components/ui/guest-kit/button';

// Temporary stand-in for M3's components/ui/ops-kit/empty-state.tsx (docs/m2/02 §3) — logged as
// design debt until that lands.
export interface EmptyHintAction {
  label: string;
  onClick: () => void;
}

export function EmptyHint({ title, body, action }: { title: string; body?: string; action?: EmptyHintAction }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="max-w-xs text-sm text-ink-muted">{body}</p>}
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
