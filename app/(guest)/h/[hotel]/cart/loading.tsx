import { Skeleton, SkeletonRegion } from '@/components/ui/guest-kit/skeleton';

export default function CartLoading() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </SkeletonRegion>
  );
}
