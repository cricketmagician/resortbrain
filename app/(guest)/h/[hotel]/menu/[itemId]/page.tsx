import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicHotel, listHotelSlugs } from '@/lib/guest/server/hotels';
import { getHotelMenu } from '@/lib/guest/server/menu';
import { ItemDetailContainer } from '@/components/guest/item-detail-container';

export const revalidate = 60;

export async function generateStaticParams() {
  const params: { hotel: string; itemId: string }[] = [];
  for (const slug of listHotelSlugs()) {
    const hotel = getPublicHotel(slug);
    if (!hotel) continue;
    const items = await getHotelMenu(hotel.id);
    for (const item of items) params.push({ hotel: slug, itemId: item.id });
  }
  return params;
}

export async function generateMetadata(props: PageProps<'/h/[hotel]/menu/[itemId]'>): Promise<Metadata> {
  const { hotel: slug, itemId } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) return {};
  const items = await getHotelMenu(hotel.id);
  const item = items.find((i) => i.id === itemId);
  return item ? { title: item.name } : {};
}

export default async function ItemPage(props: PageProps<'/h/[hotel]/menu/[itemId]'>) {
  const { hotel: slug, itemId } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const items = await getHotelMenu(hotel.id);
  const item = items.find((i) => i.id === itemId);
  if (!item) notFound();

  return <ItemDetailContainer hotel={hotel} item={item} />;
}
