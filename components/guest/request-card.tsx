import Link from 'next/link';
import { Card } from '@/components/ui/guest-kit/card';
import { StatusPill } from '@/components/ui/guest-kit/status-timeline';
import { REQUEST_STATUS } from '@/components/ui/tokens/status';
import { formatRelative } from '@/lib/guest/format';
import { REQUEST_CATEGORY_ICON } from './request-category-grid';
import { GUEST_TID } from './test-ids';
import type { ServiceRequest } from '@/lib/guest/types';

const ACTIVE_STATUSES = new Set(['created', 'acknowledged', 'in_progress']);

export function RequestCard({ request, hotelSlug, live, now }: { request: ServiceRequest; hotelSlug: string; live: boolean; now: number }) {
  const wording = REQUEST_STATUS[request.status];
  const Icon = REQUEST_CATEGORY_ICON[request.category];
  const isActive = ACTIVE_STATUSES.has(request.status);

  return (
    <Link href={`/h/${hotelSlug}/requests/${request.id}`} data-testid={GUEST_TID.activityRequest(request.id)} className="block rounded-lg focus-ring">
      <Card tone="default" interactive className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
          <span className="line-clamp-1 font-medium text-ink">{request.title}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-subtle">{formatRelative(request.createdAt, now)}</span>
          <StatusPill tone={wording.tone} live={live && isActive}>
            {wording.guest}
          </StatusPill>
        </div>
      </Card>
    </Link>
  );
}
