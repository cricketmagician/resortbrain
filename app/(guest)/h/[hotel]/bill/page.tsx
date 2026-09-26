import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { BillGate } from '@/components/guest/bill-gate';

export const revalidate = 300;

export default async function BillPage(props: PageProps<'/h/[hotel]/bill'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return <BillGate hotel={hotel} />;
}
