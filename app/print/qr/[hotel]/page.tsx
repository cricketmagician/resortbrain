import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { getPublicHotel } from '@/lib/guest/server/hotels';
import { getRoomsForHotel } from '@/lib/guest/server/rooms';
import { QrTentCard } from '@/components/guest/qr-tent-card';
import { PrintQrButton } from '@/components/guest/print-qr-button';
import { GUEST_TID } from '@/components/guest/test-ids';
import { GUEST_COPY } from '@/lib/guest/copy';

// Same absolute-URL fallback chain as app/layout.tsx and the landing demo QR.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata = { robots: { index: false, follow: false } };

// Ops-only room QR tent-card print sheet (docs/m2/02 architecture table, docs/m2/07 §4). Gated by
// RB_ENABLE_QR_SHEET, which must stay unset in production — room QR tokens are sensitive.
export default async function QrPrintPage(props: PageProps<'/print/qr/[hotel]'>) {
  if (process.env.RB_ENABLE_QR_SHEET !== 'true') notFound();

  const { hotel: slug } = await props.params;
  const hotel = getPublicHotel(slug);
  if (!hotel) notFound();

  const rooms = getRoomsForHotel(hotel.id);
  const cards = await Promise.all(
    rooms.map(async (room) => ({
      room,
      // Black on white, error correction M, a 2-module quiet zone (docs/m2/07 §4) — this is the
      // only other dangerouslySetInnerHTML in the guest app besides the theme boot script and the
      // landing demo QR, all three rendering an SVG string this codebase generated itself.
      svg: await QRCode.toString(`${SITE_URL}/q/${room.qrToken}`, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      }),
    }))
  );

  const pairs: (typeof cards)[number][][] = [];
  for (let i = 0; i < cards.length; i += 2) pairs.push(cards.slice(i, i + 2));

  return (
    <div data-testid={GUEST_TID.qrSheet} className="mx-auto max-w-3xl px-6 py-8">
      <style>{'@page { size: A4; margin: 12mm; }'}</style>
      <div className="no-print mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">{hotel.name} — Room QR codes</h1>
        <PrintQrButton label={GUEST_COPY.qrSheet.print} />
      </div>

      {cards.length === 0 && <p className="text-ink-muted">No rooms are seeded for this hotel yet.</p>}

      {pairs.map((pair, i) => (
        <div
          key={pair.map(({ room }) => room.qrToken).join('-')}
          className="mb-8 flex flex-col gap-6"
          style={{ breakAfter: i < pairs.length - 1 ? 'page' : 'auto' }}
        >
          {pair.map(({ room, svg }) => (
            <QrTentCard key={room.qrToken} hotel={hotel} room={room} svg={svg} />
          ))}
        </div>
      ))}
    </div>
  );
}
