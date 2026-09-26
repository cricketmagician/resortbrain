import { Skeleton, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';

export default function BillLoading() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}
