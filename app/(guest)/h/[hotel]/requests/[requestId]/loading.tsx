import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonTimeline } from '@/components/ui/guest-kit/skeleton';

export default function RequestTrackingLoading() {
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
