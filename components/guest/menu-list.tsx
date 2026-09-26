'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MenuItemCard } from '@/components/ui/guest-kit/menu-item-card';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { Button } from '@/components/ui/guest-kit/button';
import { useToast } from '@/components/ui/guest-kit/toast';
import { MenuSearch } from './menu-search';
import { CategoryNav } from './category-nav';
import { ItemDetail } from './item-detail';
import { CartBar } from './cart-bar';
import { EmptyHint } from './empty-hint';
import { useGuestSession } from '@/lib/guest/session';
import { useCart } from '@/lib/guest/cart';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';
import type { MenuItemVM, PublicHotel } from '@/lib/guest/types';

const VEG_ONLY_KEY = 'rb.menu.vegOnly';
const SEARCH_DEBOUNCE_MS = 120;

export function MenuList({ hotel, items }: { hotel: PublicHotel; items: MenuItemVM[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show } = useToast();
  const session = useGuestSession(hotel.id);
  const cart = useCart(session?.stayId ?? null);

  function handleQuickAdd(itemId: string) {
    const wasEmpty = cart.lines.length === 0;
    cart.add(itemId);
    if (wasEmpty) {
      show({
        tone: 'success',
        title: GUEST_COPY.menu.added,
        action: { label: GUEST_COPY.menu.viewCart, onClick: () => router.push(`/h/${hotel.slug}/cart`) },
      });
    }
  }

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    // Reads a browser-only API, so it can't run until after hydration — synced here rather than
    // in a lazy useState initializer to avoid a server/client render mismatch.
    try {
      if (sessionStorage.getItem(VEG_ONLY_KEY) === '1') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVegOnly(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  function toggleVeg() {
    setVegOnly((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(VEG_ONLY_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      if (!seen.has(item.categorySlug)) seen.set(item.categorySlug, item.category);
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (vegOnly && !item.isVeg) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, vegOnly, debouncedQuery]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, MenuItemVM[]>();
    for (const item of filtered) {
      const list = byCategory.get(item.categorySlug) ?? [];
      list.push(item);
      byCategory.set(item.categorySlug, list);
    }
    return categories.filter((c) => byCategory.has(c.slug)).map((c) => ({ ...c, items: byCategory.get(c.slug)! }));
  }, [filtered, categories]);

  const openItemId = searchParams.get('item');
  const openItem = openItemId ? items.find((i) => i.id === openItemId) : undefined;

  function openItemSheet(id: string) {
    window.history.pushState(null, '', `?item=${id}`);
  }
  function closeItemSheet() {
    window.history.pushState(null, '', window.location.pathname);
  }

  function quantityFor(id: string): number {
    return cart.lines.find((l) => l.menuItemId === id)?.quantity ?? 0;
  }

  const totalCartCount = cart.lines.reduce((sum, l) => sum + l.quantity, 0);

  let emptyState: React.ReactNode = null;
  if (items.length === 0) {
    emptyState = <EmptyHint title={GUEST_COPY.menu.empty} />;
  } else if (grouped.length === 0) {
    if (debouncedQuery) {
      emptyState = <EmptyHint title={GUEST_COPY.menu.noResults(debouncedQuery)} action={{ label: GUEST_COPY.menu.clearSearch, onClick: () => setQuery('') }} />;
    } else if (vegOnly) {
      emptyState = <EmptyHint title="No vegetarian dishes in this section" />;
    }
  }

  return (
    <div data-testid={GUEST_TID.menu} className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-display-md text-ink">{GUEST_COPY.menu.title}</h1>
        <p className="text-sm text-ink-muted">
          {session ? GUEST_COPY.menu.subtitle(session.roomNumber, hotel.info.deliveryEstimate ?? '') : GUEST_COPY.menu.subtitleNoSession}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <MenuSearch value={query} onChange={setQuery} />
        </div>
        <Button variant="chip" pressed={vegOnly} onClick={toggleVeg} data-testid={GUEST_TID.vegToggle}>
          {GUEST_COPY.menu.vegOnly}
        </Button>
      </div>

      {grouped.length > 0 && <CategoryNav categories={grouped.map(({ slug, name }) => ({ slug, name }))} />}

      {emptyState}

      {grouped.map((group) => (
        <section key={group.slug} id={`category-${group.slug}`} data-category-slug={group.slug} className="scroll-mt-32">
          <h2 className="mb-1 text-sm font-semibold text-ink-subtle">
            {group.name} · {group.items.length}
          </h2>
          <div>
            {group.items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                layout="row"
                quantity={quantityFor(item.id)}
                canOrder={!!session}
                onOpen={() => openItemSheet(item.id)}
                onAdd={() => handleQuickAdd(item.id)}
                onIncrement={() => cart.setQty(item.id, quantityFor(item.id) + 1)}
                onDecrement={() => cart.setQty(item.id, quantityFor(item.id) - 1)}
              />
            ))}
          </div>
        </section>
      ))}

      {totalCartCount > 0 && !openItem && <CartBar hotelSlug={hotel.slug} count={totalCartCount} />}

      <Sheet open={!!openItem} onOpenChange={(open) => !open && closeItemSheet()} title={openItem?.name ?? ''}>
        <div data-testid={GUEST_TID.itemSheet}>
          {openItem && (
            <ItemDetail
              item={openItem}
              quantity={quantityFor(openItem.id)}
              canOrder={!!session}
              note={cart.lines.find((l) => l.menuItemId === openItem.id)?.note ?? ''}
              onAdd={() => cart.add(openItem.id)}
              onChange={(qty) => cart.setQty(openItem.id, qty)}
              onNoteChange={(note) => cart.setItemNote(openItem.id, note)}
            />
          )}
        </div>
      </Sheet>
    </div>
  );
}
