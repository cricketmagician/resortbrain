import { Skeleton } from '@/components/ui/guest-kit/skeleton';

export default function RequestLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
