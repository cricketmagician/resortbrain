import { notFound } from 'next/navigation';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { getHotelMenu } from '@/lib/guest/server/menu';
import { HotelHero } from '@/components/guest/hotel-hero';
import { ActiveStrip } from '@/components/guest/active-strip';
import { QuickActions } from '@/components/guest/quick-actions';
import { ChefsPicks } from '@/components/guest/chefs-picks';
import { InfoCards } from '@/components/guest/info-cards';
import { WelcomeToast } from '@/components/guest/welcome-toast';
import { GUEST_TID } from '@/components/guest/test-ids';

export const revalidate = 300;

export default async function HotelHomePage(props: PageProps<'/h/[hotel]'>) {
  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const menu = await getHotelMenu(hotel.id);
  const chefsPicks = menu.filter((item) => item.featured && item.available).slice(0, 5);

  return (
    <div data-testid={GUEST_TID.home} className="flex flex-col gap-6 pb-4">
      <HotelHero hotel={hotel} />
      <ActiveStrip hotelId={hotel.id} hotelSlug={hotel.slug} />
      <QuickActions hotelSlug={hotel.slug} />
      <ChefsPicks hotel={hotel} items={chefsPicks} />
      <InfoCards hotel={hotel} />
      <WelcomeToast hotelName={hotel.name} />
    </div>
  );
}
