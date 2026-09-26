import { Fragment } from 'react';
import { formatDateTime, formatMoney, formatTime } from '@/lib/guest/format';
import { GUEST_COPY } from '@/lib/guest/copy';
import type { GuestSession, Invoice, Order, PublicHotel } from '@/lib/guest/types';

export interface PrintableInvoiceProps {
  hotel: PublicHotel;
  session: GuestSession;
  invoice: Invoice;
  orders: Order[];
}

// A4 tax invoice (docs/m2/04 §12). print-only: invisible on screen, shown only inside a
// forced-light @page A4 print pass that ReceiptView switches on.
export function PrintableInvoice({ hotel, session, invoice, orders }: PrintableInvoiceProps) {
  return (
    <div className="print-only bg-bg px-2 text-[10.5pt] text-ink" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <div className="flex items-start justify-between gap-6 border-b border-line pb-3">
        <div>
          {/* A plain img, not next/image: this element is invisible until print (print-only),
              so next/image's lazy-loading and LCP optimizations don't apply here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {hotel.logoUrl && <img src={hotel.logoUrl} alt="" className="mb-1 h-10 grayscale" />}
          <p className="font-semibold">{hotel.name}</p>
          {hotel.contact.address && <p className="text-ink-muted">{hotel.contact.address}</p>}
          {hotel.contact.phone && <p className="text-ink-muted">{hotel.contact.phone}</p>}
          {hotel.contact.gstin && <p className="text-ink-muted">GSTIN: {hotel.contact.gstin}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold">{GUEST_COPY.receipt.taxInvoice}</p>
          <p>
            {GUEST_COPY.receipt.invoiceNo} {invoice.invoiceNumber}
          </p>
          <p>
            {GUEST_COPY.receipt.date}: {formatDateTime(invoice.paidAt ?? invoice.createdAt, hotel.timeZone)}
          </p>
          <p>
            {GUEST_COPY.receipt.room}: {session.roomNumber}
          </p>
          <p>
            {GUEST_COPY.receipt.guestLabel}: {session.guestName}
          </p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse tabular">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-1 pr-2 font-semibold">#</th>
            <th className="py-1 pr-2 font-semibold">{GUEST_COPY.receipt.columns.item}</th>
            <th className="py-1 pr-2 text-right font-semibold">{GUEST_COPY.receipt.columns.qty}</th>
            <th className="py-1 pr-2 text-right font-semibold">{GUEST_COPY.receipt.columns.rate}</th>
            <th className="py-1 text-right font-semibold">{GUEST_COPY.receipt.columns.amount}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <Fragment key={order.id}>
              <tr style={{ breakInside: 'avoid' }}>
                <td colSpan={5} className="pb-1 pt-3 text-ink-subtle italic">
                  {GUEST_COPY.receipt.orderAt(order.orderNumber, formatTime(order.createdAt, hotel.timeZone))}
                </td>
              </tr>
              {order.lines.map((line, i) => (
                <tr key={line.menuItemId} className="border-b border-line" style={{ breakInside: 'avoid' }}>
                  <td className="py-1 pr-2 text-ink-muted">{i + 1}</td>
                  <td className="py-1 pr-2">{line.name}</td>
                  <td className="py-1 pr-2 text-right">{line.quantity}</td>
                  <td className="py-1 pr-2 text-right">{formatMoney(line.unitPricePaise, session.currency)}</td>
                  <td className="py-1 text-right">{formatMoney(line.totalPricePaise, session.currency)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 flex w-64 flex-col gap-1">
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
        {invoice.discountPaise > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="tabular">-{formatMoney(invoice.discountPaise, session.currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-1 font-bold">
          <span>{GUEST_COPY.bill.totalDue}</span>
          <span className="tabular">{formatMoney(invoice.totalPaise, session.currency)}</span>
        </div>
        {invoice.paymentMethod && invoice.paidAt && (
          <div className="flex justify-between text-ink-muted">
            <span>{GUEST_COPY.bill.paid}</span>
            <span>
              {GUEST_COPY.receipt.methodLong[invoice.paymentMethod]}, {formatTime(invoice.paidAt, hotel.timeZone)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-line pt-2 text-[8pt] text-ink-subtle">
        <p>{GUEST_COPY.receipt.signatureNote}</p>
        <p>{GUEST_COPY.receipt.testModeNote}</p>
        <p>{GUEST_COPY.receipt.poweredBy}</p>
      </div>
    </div>
  );
}
