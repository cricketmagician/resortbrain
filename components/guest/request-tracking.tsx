'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { SkeletonCard, SkeletonRegion, SkeletonTimeline, Skeleton } from '@/components/ui/guest-kit/skeleton';
import { StatusTimeline } from '@/components/ui/guest-kit/status-timeline';
import { AnimatedCheck } from './animated-check';
import { LiveIndicator } from './live-indicator';
import { DelayNotice } from './delay-notice';
import { EmptyHint } from './empty-hint';
import { useRequest } from '@/lib/guest/data/hooks';
import { useLiveState } from '@/lib/guest/data/live';
import { useNow } from '@/lib/guest/use-now';
import { buildRequestTimeline, requestStepIndex } from '@/lib/guest/status';
import { REQUEST_STATUS } from '@/components/ui/tokens/status';
import { formatRelative } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel, RequestStatus, ServiceRequest } from '@/lib/guest/types';

const DEFAULT_SLA_MINUTES = 10;

function SentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') !== '1') return;
    // See PlacedBanner (order-tracking.tsx) for why this can't be a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    params.delete('sent');
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div role="status" className="animate-rise flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
      <AnimatedCheck ring={false} className="size-4 shrink-0" />
      {GUEST_COPY.tracking.sentBanner}
    </div>
  );
}

// See useStableOrderStatus (order-tracking.tsx) — same "adjust state during render" pattern so an
// out-of-order poll response never moves the timeline backwards.
function useStableRequestStatus(request: ServiceRequest): { status: RequestStatus; acknowledgedAt?: string; completedAt?: string } {
  const [stable, setStable] = useState({ status: request.status, acknowledgedAt: request.acknowledgedAt, completedAt: request.completedAt });
  const isTerminal = request.status === 'cancelled' || request.status === 'rejected';
  const wasTerminal = stable.status === 'cancelled' || stable.status === 'rejected';
  const advances = requestStepIndex(request.status) >= requestStepIndex(stable.status);
  const next = { status: request.status, acknowledgedAt: request.acknowledgedAt, completedAt: request.completedAt };
  if ((isTerminal || wasTerminal || advances) && (next.status !== stable.status || next.acknowledgedAt !== stable.acknowledgedAt || next.completedAt !== stable.completedAt)) {
    setStable(next);
    return next;
  }
  return stable;
}

function RequestTrackingLoaded({ hotel, request }: { hotel: PublicHotel; request: ServiceRequest }) {
  const now = useNow(30000);
  const live = useLiveState();
  const stable = useStableRequestStatus(request);
  const timeline = buildRequestTimeline({ status: stable.status, createdAt: request.createdAt, acknowledgedAt: stable.acknowledgedAt, completedAt: stable.completedAt });
  const wording = REQUEST_STATUS[stable.status];
  const isTerminal = stable.status === 'cancelled' || stable.status === 'rejected' || stable.status === 'completed';

  const minutesSinceCreated = (now - new Date(request.createdAt).getTime()) / 60000;
  const slaThreshold = Math.max(5, (request.slaMinutes ?? DEFAULT_SLA_MINUTES) / 2);
  const showDelay = stable.status === 'created' && minutesSinceCreated > slaThreshold;
  const [delayDismissed, setDelayDismissed] = useState(false);

  return (
    <div data-testid={GUEST_TID.requestTracking} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Button href={`/h/${hotel.slug}/activity`} variant="ghost" size="md">
          ‹ {GUEST_COPY.common.back}
        </Button>
        <span className="line-clamp-1 font-medium text-ink">{request.title}</span>
      </div>

      <SentBanner />

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{wording.guest}</p>
          {!isTerminal && <LiveIndicator state={live} />}
        </div>
        <h1 className="mt-1 font-display text-display-md text-ink">{wording.guestHint}</h1>
        <p className="mt-1 text-sm text-ink-subtle">{GUEST_COPY.tracking.placedAgo(formatRelative(request.createdAt, now))}</p>
        {request.assigneeFirstName && <p className="mt-1 text-sm text-ink-muted">{GUEST_COPY.tracking.assignee(request.assigneeFirstName)}</p>}
      </div>

      <StatusTimeline
        steps={timeline.steps}
        currentKey={timeline.currentKey}
        terminal={timeline.terminal}
        timeZone={hotel.timeZone}
        live={!isTerminal}
        announce
        testId={GUEST_TID.requestTimeline}
        currentTestId={GUEST_TID.requestCurrent}
      />

      {showDelay && !delayDismissed && (
        <DelayNotice message={GUEST_COPY.tracking.delay.request} onDismiss={() => setDelayDismissed(true)} />
      )}

      {request.details && (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm italic text-ink-muted">&ldquo;{request.details}&rdquo;</p>
      )}

      {hotel.contact.phone && (
        <Button href={`tel:${hotel.contact.phone}`} variant="secondary" size="lg" fullWidth>
          {GUEST_COPY.common.callDesk}
        </Button>
      )}
    </div>
  );
}

export function RequestTracking({ hotel, session, requestId }: { hotel: PublicHotel; session: GuestSession; requestId: string }) {
  const { data: request, isLoading, error } = useRequest(session, requestId);

  if (isLoading && !request) {
    return (
      <SkeletonRegion>
        <div className="flex flex-col gap-5" aria-hidden="true">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-56" />
          <SkeletonTimeline steps={4} />
          <SkeletonCard />
        </div>
      </SkeletonRegion>
    );
  }

  if (error || !request) {
    return (
      <EmptyHint title={GUEST_COPY.tracking.notFoundRequest} action={{ label: GUEST_COPY.activity.title, href: `/h/${hotel.slug}/activity` }} />
    );
  }

  return <RequestTrackingLoaded hotel={hotel} request={request} />;
}
