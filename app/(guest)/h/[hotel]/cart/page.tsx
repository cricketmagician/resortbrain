import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { getHotelMenu } from '@/lib/guest/server/menu';
import { CartGate } from '@/components/guest/cart-gate';

export const revalidate = 60;

export default async function CartPage(props: PageProps<'/h/[hotel]/cart'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const items = await getHotelMenu(hotel.id);

  return <CartGate hotel={hotel} menu={items} />;
}
