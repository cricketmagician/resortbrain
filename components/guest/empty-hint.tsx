import { Button } from '@/components/ui/guest-kit/button';

// Temporary stand-in for M3's components/ui/ops-kit/empty-state.tsx (docs/m2/02 §3) — logged as
// design debt until that lands.
export type EmptyHintAction = { label: string } & ({ onClick: () => void; href?: undefined } | { href: string; onClick?: undefined });

export function EmptyHint({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: EmptyHintAction | EmptyHintAction[];
}) {
  const actions = action ? (Array.isArray(action) ? action : [action]) : [];
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="max-w-xs text-sm text-ink-muted">{body}</p>}
      {actions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {actions.map((a) => (
            <Button key={a.label} variant="secondary" size="md" href={a.href} onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
