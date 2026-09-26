import { Wifi, Coffee, Waves, Clock, type LucideIcon } from 'lucide-react';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { PublicHotel } from '@/lib/guest/types';

interface InfoCard {
  icon: LucideIcon;
  title: string;
  value: string;
}

export function InfoCards({ hotel }: { hotel: PublicHotel }) {
  const cards: InfoCard[] = [];

  if (hotel.info.wifiName) {
    cards.push({ icon: Wifi, title: 'Wi-Fi', value: GUEST_COPY.home.info.wifi(hotel.info.wifiName) });
  }
  if (hotel.info.breakfastHours) {
    cards.push({ icon: Coffee, title: 'Breakfast', value: hotel.info.breakfastHours });
  }
  if (hotel.info.poolHours) {
    cards.push({ icon: Waves, title: 'Pool', value: hotel.info.poolHours });
  }
  if (hotel.info.checkoutTime) {
    cards.push({ icon: Clock, title: 'Check-out', value: hotel.info.checkoutTime });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink">{card.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
