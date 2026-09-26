import { SkeletonMenuItem } from '@/components/ui/guest-kit/skeleton';

export default function MenuLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-8 w-40 animate-shimmer rounded bg-surface-2" />
      <div className="h-12 animate-shimmer rounded-full bg-surface-2" />
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonMenuItem key={i} />
      ))}
    </div>
  );
}
