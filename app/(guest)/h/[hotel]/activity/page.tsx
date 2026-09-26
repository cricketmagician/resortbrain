import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { ActivityGate } from '@/components/guest/activity-gate';

export const revalidate = 300;

export default async function ActivityPage(props: PageProps<'/h/[hotel]/activity'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return <ActivityGate hotel={hotel} />;
}
