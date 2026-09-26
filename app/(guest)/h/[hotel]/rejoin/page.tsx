import { notFound } from 'next/navigation';
import { RejoinScreen, type RejoinReason } from '@/components/guest/rejoin-screen';
import { getPublicHotel } from '@/lib/guest/server/hotels';

export const revalidate = 300;

const VALID_REASONS: readonly RejoinReason[] = ['expired', 'revoked', 'checked_out', 'invalid', 'default'];

export default async function HotelRejoinPage(props: PageProps<'/h/[hotel]/rejoin'>) {
  const { hotel: slug } = await props.params;
  const searchParams = await props.searchParams;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const reasonParam = typeof searchParams.reason === 'string' ? searchParams.reason : undefined;
  const reason = (VALID_REASONS as string[]).includes(reasonParam ?? '') ? (reasonParam as RejoinReason) : 'default';

  return <RejoinScreen reason={reason} hotel={hotel} />;
}
