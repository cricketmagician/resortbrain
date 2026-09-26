import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { RequestGate } from '@/components/guest/request-gate';
import { Skeleton } from '@/components/ui/guest-kit/skeleton';

export const revalidate = 300;

function RequestSkeleton() {
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

// RequestForm reads ?c= via useSearchParams() to preselect a category, which needs a Suspense
// boundary on this otherwise-static page (docs/m2/04 header note).
export default async function RequestPage(props: PageProps<'/h/[hotel]/request'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return (
    <Suspense fallback={<RequestSkeleton />}>
      <RequestGate hotel={hotel} />
    </Suspense>
  );
}
