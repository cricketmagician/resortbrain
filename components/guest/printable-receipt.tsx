import { formatMoney, formatTime } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { GuestSession, Invoice, Order, PublicHotel } from '@/lib/guest/types';

export interface PrintableReceiptProps {
  hotel: PublicHotel;
  session: GuestSession;
  invoice: Invoice;
  orders: Order[];
}

function Dashes() {
  return <div className="my-2 border-t border-dashed border-line" aria-hidden />;
}

// 80mm thermal receipt (docs/m2/04 §12). print-only: invisible on screen, shown only inside a
// forced-light @page 80mm print pass that ReceiptView switches on.
export function PrintableReceipt({ hotel, session, invoice, orders }: PrintableReceiptProps) {
  const lines = orders.flatMap((order) => order.lines);

  return (
    <div className="print-only bg-bg text-[9pt] text-ink" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <p className="text-center font-bold">{hotel.name}</p>
      {hotel.contact.address && <p className="text-center">{hotel.contact.address}</p>}
      {hotel.contact.phone && <p className="text-center">{hotel.contact.phone}</p>}
      <Dashes />
      <p>{invoice.invoiceNumber}</p>
      <p>
        {GUEST_COPY.receipt.room} {session.roomNumber} · {session.guestName}
      </p>
      <Dashes />
      {lines.map((line) => (
        <div key={line.menuItemId} className="flex justify-between gap-2" style={{ breakInside: 'avoid' }}>
          <span>
            {line.quantity} × {line.name}
          </span>
          <span className="shrink-0 tabular">{formatMoney(line.totalPricePaise, session.currency)}</span>
        </div>
      ))}
      <Dashes />
      <div className="flex justify-between">
        <span>{GUEST_COPY.common.money.subtotal}</span>
        <span className="tabular">{formatMoney(invoice.subtotalPaise, session.currency)}</span>
      </div>
      <div className="flex justify-between">
        <span>{GUEST_COPY.common.money.tax}</span>
        <span className="tabular">{formatMoney(invoice.taxPaise, session.currency)}</span>
      </div>
      <div className="flex justify-between">
        <span>{GUEST_COPY.common.money.serviceCharge}</span>
        <span className="tabular">{formatMoney(invoice.serviceChargePaise, session.currency)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>{GUEST_COPY.bill.totalDue}</span>
        <span className="tabular">{formatMoney(invoice.totalPaise, session.currency)}</span>
      </div>
      {invoice.paymentMethod && invoice.paidAt && (
        <div className="flex justify-between">
          <span>{GUEST_COPY.bill.paid}</span>
          <span>
            {GUEST_COPY.receipt.methodLong[invoice.paymentMethod]}, {formatTime(invoice.paidAt, hotel.timeZone)}
          </span>
        </div>
      )}
      <Dashes />
      <p className="text-center">{GUEST_COPY.receipt.thankYou}</p>
    </div>
  );
}
