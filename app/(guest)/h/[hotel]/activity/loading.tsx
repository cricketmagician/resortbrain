import { Skeleton, SkeletonCard, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';

export default function ActivityLoading() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-16 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </SkeletonRegion>
  );
}
