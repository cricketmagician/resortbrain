'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { BedDouble, Plus } from 'lucide-react';
import { Card } from '@/components/ui/guest-kit/card';
import { Button } from '@/components/ui/guest-kit/button';
import { Textarea } from '@/components/ui/guest-kit/input';
import { useToast } from '@/components/ui/guest-kit/toast';
import { CartLineRow } from './cart-line-row';
import { QuoteSummary } from './quote-summary';
import { useCart, cartHash } from '@/lib/guest/cart';
import { getGuestApi, GuestApiError } from '@/lib/guest/data';
import { ordersKey } from '@/lib/guest/data/hooks';
import * as idempotency from '@/lib/guest/idempotency';
import { clearSession } from '@/lib/guest/session';
import { cn } from '@/lib/cn';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { CartLine, GuestSession, MenuItemVM, Order, PublicHotel, Quote } from '@/lib/guest/types';

function noteStorageKey(stayId: string): string {
  return `rb.cart.note.${stayId}`;
}

function compileSpecialInstructions(lines: CartLine[], menuById: Map<string, MenuItemVM>, generalNote: string): string {
  const parts: string[] = [];
  for (const line of lines) {
    if (!line.note) continue;
    const item = menuById.get(line.menuItemId);
    parts.push(`${item?.name ?? line.menuItemId}: ${line.note}`);
  }
  const trimmedGeneral = generalNote.trim();
  if (trimmedGeneral) parts.push(trimmedGeneral);
  return parts.join('\n');
}

export interface CartViewProps {
  hotel: PublicHotel;
  session: GuestSession;
  menu: MenuItemVM[];
}

// The full checkout screen (docs/m2/04 §6): lines, an add-more link, a kitchen note, the
// server-priced summary, and the sticky place-order footer. Every price on this screen is either
// the menu's own unit price (already server-set) or a live `Quote` — nothing here multiplies.
export function CartView({ hotel, session, menu }: CartViewProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { show } = useToast();
  const cart = useCart(session.stayId);

  const menuById = useMemo(() => new Map(menu.map((item) => [item.id, item])), [menu]);
  const resolvedLines = useMemo(
    () =>
      cart.lines.flatMap((line) => {
        const item = menuById.get(line.menuItemId);
        return item ? [{ line, item }] : [];
      }),
    [cart.lines, menuById]
  );

  // Starts empty, not read from sessionStorage: sessionStorage doesn't exist
  // during SSR, so a lazy initializer reading it made the server always
  // render '' while the client could render a returning guest's saved note
  // — a hydration mismatch. Reading it in an effect keeps the first
  // server/client render in agreement; the saved note (if any) fills in
  // right after mount.
  const [generalNote, setGeneralNoteState] = useState('');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(noteStorageKey(session.stayId));
      if (saved) setGeneralNoteState(saved);
    } catch {
      // ignore — note just won't be restored this time
    }
  }, [session.stayId]);

  function setGeneralNote(value: string) {
    setGeneralNoteState(value);
    try {
      sessionStorage.setItem(noteStorageKey(session.stayId), value);
    } catch {
      // ignore — the note just won't survive a reload this time
    }
  }

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [supportsQuote, setSupportsQuote] = useState(true);

  useEffect(() => {
    if (cart.lines.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        setQuoteLoading(true);
        try {
          const api = await getGuestApi();
          if (cancelled) return;
          setSupportsQuote(api.capabilities.quote);
          const result = api.capabilities.quote ? await api.quoteOrder(session, cart.lines) : null;
          if (!cancelled) setQuote(result);
        } catch {
          if (!cancelled) setQuote(null);
        } finally {
          if (!cancelled) setQuoteLoading(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cart.lines, session]);

  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const specialInstructions = useMemo(
    () => compileSpecialInstructions(cart.lines, menuById, generalNote),
    [cart.lines, menuById, generalNote]
  );
  const overLimit = specialInstructions.length > 500;

  async function handlePlaceOrder() {
    if (overLimit || placing) return;
    setPlacing(true);
    setSubmitError(null);

    const idemHash = `${cartHash(cart.lines)}|${generalNote.trim()}`;
    const key = idempotency.forCheckout(session.stayId, idemHash);

    try {
      const api = await getGuestApi();
      const order = await api.placeOrder(session, {
        lines: cart.lines,
        specialInstructions: specialInstructions || undefined,
        idempotencyKey: key,
      });
      idempotency.settle('checkout', session.stayId);
      cart.clear();
      try {
        sessionStorage.removeItem(noteStorageKey(session.stayId));
      } catch {
        // ignore
      }
      await mutate(ordersKey(session.stayId), (current: Order[] | undefined) => [order, ...(current ?? [])], {
        revalidate: false,
      });
      router.replace(`/h/${hotel.slug}/orders/${order.id}?placed=1`);
    } catch (err) {
      setPlacing(false);

      if (err instanceof GuestApiError) {
        if (err.kind === 'expired') {
          clearSession();
          router.push(`/h/${hotel.slug}/rejoin?reason=expired`);
          return;
        }
        if (err.kind === 'validation') {
          const badLine = cart.lines.find((line) => {
            const item = menuById.get(line.menuItemId);
            return err.message.startsWith(line.menuItemId) || (!!item && err.message.includes(item.name));
          });
          if (badLine) {
            const badItem = menuById.get(badLine.menuItemId);
            cart.setQty(badLine.menuItemId, 0);
            show({ tone: 'error', title: GUEST_COPY.cart.error.unavailable(badItem?.name ?? badLine.menuItemId) });
            return;
          }
        }
        if (err.kind === 'rate_limited') {
          show({ tone: 'error', title: GUEST_COPY.cart.error.rate });
          return;
        }
        if (err.kind === 'network' || err.kind === 'timeout') {
          show({ tone: 'error', title: GUEST_COPY.cart.error.offline });
          return;
        }
      }
      setSubmitError(GUEST_COPY.cart.error.generic);
    }
  }

  if (resolvedLines.length === 0) {
    return (
      <div data-testid={GUEST_TID.cartEmpty} className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-4 text-center">
        <div>
          <p className="font-display text-xl text-ink">{GUEST_COPY.cart.empty.title}</p>
          <p className="mt-2 text-sm text-ink-muted">{GUEST_COPY.cart.empty.body}</p>
        </div>
        <Button href={`/h/${hotel.slug}/menu`} variant="primary" size="lg">
          {GUEST_COPY.cart.empty.cta}
        </Button>
      </div>
    );
  }

  return (
    <div data-testid={GUEST_TID.cart} className="flex flex-col gap-5 pb-[13rem]">
      <h1 className="font-display text-display-md text-ink">{GUEST_COPY.cart.title}</h1>

      <Card tone="outline" className="flex items-start gap-3 p-4">
        <BedDouble aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{GUEST_COPY.cart.deliverTo}</p>
          <p className="mt-0.5 font-medium text-ink">{GUEST_COPY.cart.room(session.roomNumber, hotel.shortName)}</p>
          {hotel.info.deliveryEstimate && <p className="mt-0.5 text-sm text-ink-muted">{hotel.info.deliveryEstimate}</p>}
        </div>
      </Card>

      <Card tone="default" className="px-4">
        <ul className="divide-y divide-line">
          {resolvedLines.map(({ line, item }) => (
            <CartLineRow
              key={line.menuItemId}
              item={item}
              quantity={line.quantity}
              note={line.note ?? ''}
              onQtyChange={(quantity) => cart.setQty(line.menuItemId, quantity)}
              onNoteChange={(note) => cart.setItemNote(line.menuItemId, note)}
            />
          ))}
        </ul>
      </Card>

      <Button
        href={`/h/${hotel.slug}/menu`}
        variant="ghost"
        size="md"
        leading={<Plus aria-hidden className="size-4" strokeWidth={1.75} />}
        className="self-start"
      >
        {GUEST_COPY.cart.addMore}
      </Button>

      <div>
        <label htmlFor="cart-note" className="text-sm font-medium text-ink">
          {GUEST_COPY.cart.note.label}
        </label>
        <div data-testid={GUEST_TID.cartNote} className="mt-1.5">
          <Textarea
            id="cart-note"
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value.slice(0, 500))}
            maxLength={500}
            showCount={false}
            placeholder={GUEST_COPY.item.note.placeholder}
            aria-describedby="cart-note-counter"
          />
        </div>
        <p
          id="cart-note-counter"
          role={overLimit ? 'alert' : undefined}
          aria-live="polite"
          className={cn('mt-1 text-right text-xs tabular', overLimit ? 'font-medium text-danger' : 'text-ink-subtle')}
        >
          {overLimit ? GUEST_COPY.cart.error.tooLong : `${specialInstructions.length} / 500`}
        </p>
      </div>

      <QuoteSummary quote={quote} loading={quoteLoading} supportsQuote={supportsQuote} hotelName={hotel.name} currency={session.currency} />

      <div className="glass no-print fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] z-30 border-t border-line">
        <div className="mx-auto flex max-w-[480px] flex-col gap-2 px-4 pb-4 pt-3">
          {submitError && (
            <p role="alert" className="text-sm text-danger">
              {submitError}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={placing}
            disabled={overLimit}
            onClick={handlePlaceOrder}
            data-testid={GUEST_TID.cartPlaceOrder}
          >
            {placing ? GUEST_COPY.cart.placing : GUEST_COPY.cart.place}
          </Button>
        </div>
      </div>
    </div>
  );
}
