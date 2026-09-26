import { UtensilsCrossed, ConciergeBell, Receipt, Camera } from 'lucide-react';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { PublicHotel } from '@/lib/guest/types';
import type { PrintableRoom } from '@/lib/guest/server/rooms';

const LINE_ICONS = [UtensilsCrossed, ConciergeBell, Receipt] as const;

// One A4 tent card (docs/m2/07 §4): a table-top placard for a single room. `svg` is the room's QR
// code, pre-rendered by the page (qrcode.toString) so this stays a plain, synchronous component.
export function QrTentCard({ hotel, room, svg }: { hotel: PublicHotel; room: PrintableRoom; svg: string }) {
  return (
    <div
      data-testid={GUEST_TID.qrSheetCard(room.roomNumber)}
      className="flex flex-1 flex-col items-center gap-3 border border-dashed border-ink-subtle p-6 text-center"
      style={{ breakInside: 'avoid' }}
    >
      <div className="flex items-center gap-2">
        {/* Print-only sheet: a plain img keeps this independent of next/image's runtime optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hotel.logoUrl && <img src={hotel.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover grayscale" />}
        <span className="font-display text-lg text-ink">{hotel.name}</span>
      </div>
      <p className="text-sm text-ink-muted">{GUEST_COPY.qrSheet.subtitle}</p>

      {/* The generated SVG carries its own width/height (240px) for crisp module edges — [&>svg]
          rescales it to fill this mm-sized box instead of overflowing at its native pixel size. */}
      <div className="my-1 [&>svg]:h-full [&>svg]:w-full" style={{ width: '52mm', height: '52mm' }} dangerouslySetInnerHTML={{ __html: svg }} />

      <ul className="flex flex-col gap-1">
        {GUEST_COPY.qrSheet.lines.map((line, i) => {
          const Icon = LINE_ICONS[i];
          return (
            <li key={line} className="flex items-center justify-center gap-2 text-sm text-ink-muted">
              <Icon aria-hidden className="size-4 text-ink-subtle" strokeWidth={1.75} />
              {line}
            </li>
          );
        })}
      </ul>

      <p className="tabular font-display text-3xl text-ink">{room.roomNumber}</p>

      <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
        <Camera aria-hidden className="size-3.5" strokeWidth={1.75} />
        {GUEST_COPY.qrSheet.noAppNeeded}
      </p>
    </div>
  );
}
