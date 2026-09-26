import type { PublicHotel } from '@/lib/guest/types';
import { Greeting } from './greeting';
import { ResilientImage } from './resilient-image';

export function HotelHero({ hotel }: { hotel: PublicHotel }) {
  return (
    <div className="-mx-4 -mt-4">
      <div className="relative h-[220px] w-full overflow-hidden bg-surface-3">
        {hotel.bannerUrl ? (
          <ResilientImage src={hotel.bannerUrl} alt="" fill priority sizes="480px" className="object-cover" />
        ) : (
          <div className="size-full" style={{ backgroundImage: 'linear-gradient(160deg, var(--rb-surface-3), var(--rb-surface-1))' }} />
        )}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top, var(--rb-bg), transparent 65%)' }} />
      </div>
      <div className="-mt-10 px-4">
        <span className="grid size-16 place-items-center overflow-hidden rounded-full border-2 border-hotel bg-surface shadow-rb-2">
          {hotel.logoUrl ? (
            <ResilientImage
              src={hotel.logoUrl}
              alt=""
              width={64}
              height={64}
              className="size-full object-cover"
              fallbackClassName="grid size-full place-items-center"
              fallback={<span className="font-display text-xl text-hotel">{hotel.shortName.charAt(0)}</span>}
            />
          ) : (
            <span className="font-display text-xl text-hotel">{hotel.shortName.charAt(0)}</span>
          )}
        </span>
        <h1 className="mt-3 font-display text-display-md text-ink">{hotel.name}</h1>
        <p className="text-sm text-ink-muted">{hotel.tagline}</p>
        <Greeting hotel={hotel} />
      </div>
    </div>
  );
}
