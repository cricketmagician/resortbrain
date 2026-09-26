import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { OrderTrackingGate } from '@/components/guest/order-tracking-gate';

export const revalidate = 300;

export default async function OrderTrackingPage(props: PageProps<'/h/[hotel]/orders/[orderId]'>) {
  const { hotel: slug, orderId } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return <OrderTrackingGate hotel={hotel} orderId={orderId} />;
}
