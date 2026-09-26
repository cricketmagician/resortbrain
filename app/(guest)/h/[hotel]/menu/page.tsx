import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { getHotelMenu } from '@/lib/guest/server/menu';
import { MenuList } from '@/components/guest/menu-list';
import { SkeletonMenuItem } from '@/components/ui/guest-kit/skeleton';

export const revalidate = 60;

function MenuSkeleton() {
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

// The item sheet's open/close state is driven by the ?item= search param (useSearchParams inside
// MenuList), which needs a Suspense boundary on this otherwise-static page (docs/m2/04 header note).
export default async function MenuPage(props: PageProps<'/h/[hotel]/menu'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const items = await getHotelMenu(hotel.id);

  return (
    <Suspense fallback={<MenuSkeleton />}>
      <MenuList hotel={hotel} items={items} />
    </Suspense>
  );
}
