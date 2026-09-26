import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { ReceiptGate } from '@/components/guest/receipt-gate';

export const revalidate = 300;

export default async function ReceiptPage(props: PageProps<'/h/[hotel]/receipt/[invoiceId]'>) {
  const { hotel: slug, invoiceId } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  return <ReceiptGate hotel={hotel} invoiceId={invoiceId} />;
}
