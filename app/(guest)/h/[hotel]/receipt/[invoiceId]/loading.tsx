import { Skeleton, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';

export default function ReceiptLoading() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col items-center gap-4" aria-hidden="true">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}
