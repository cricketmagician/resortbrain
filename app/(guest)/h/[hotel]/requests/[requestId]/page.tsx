import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { RequestTrackingGate } from '@/components/guest/request-tracking-gate';

export const revalidate = 300;

export default async function RequestTrackingPage(props: PageProps<'/h/[hotel]/requests/[requestId]'>) {
  const { hotel: slug, requestId } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return <RequestTrackingGate hotel={hotel} requestId={requestId} />;
}
