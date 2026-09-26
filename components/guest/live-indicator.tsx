import { StatusPill } from '@/components/ui/guest-kit/status-timeline';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { LiveState } from '@/lib/guest/data/live';

// 'live' and 'polling' both read as connected to the guest — only a dropped connection or a
// confirmed offline state gets its own wording (docs/m2/05 §6).
export function LiveIndicator({ state, testId }: { state: LiveState; testId?: string }) {
  return (
    <span data-testid={testId}>
      {state === 'reconnecting' ? (
        <StatusPill tone="warning">{GUEST_COPY.tracking.reconnecting}</StatusPill>
      ) : state === 'offline' ? (
        <StatusPill tone="neutral">{GUEST_COPY.tracking.offline}</StatusPill>
      ) : (
        <StatusPill tone="success" live>
          {GUEST_COPY.tracking.live}
        </StatusPill>
      )}
    </span>
  );
}
