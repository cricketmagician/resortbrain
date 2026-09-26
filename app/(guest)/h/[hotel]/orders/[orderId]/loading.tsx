import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonTimeline } from '@/components/ui/guest-kit/skeleton';

export default function OrderTrackingLoading() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-56" />
        <SkeletonTimeline steps={5} />
        <SkeletonCard />
      </div>
    </SkeletonRegion>
  );
}
