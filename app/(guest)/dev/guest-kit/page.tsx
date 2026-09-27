'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/guest-kit/button';
import { Field, Input, Textarea, SearchField, NumberStepper } from '@/components/ui/guest-kit/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/guest-kit/card';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { ToastProvider, useToast, type ToastTone } from '@/components/ui/guest-kit/toast';
import { SkeletonText, SkeletonMenuItem, SkeletonTimeline, SkeletonCard } from '@/components/ui/guest-kit/skeleton';
import { StatusTimeline, StatusPill } from '@/components/ui/guest-kit/status-timeline';
import { MenuItemCard, type MenuItemCardData } from '@/components/ui/guest-kit/menu-item-card';
import { buildOrderTimeline } from '@/lib/guest/status';
import { cn } from '@/lib/cn';

if (process.env.NODE_ENV === 'production') {
  notFound();
}

const FIXED_SHOWCASE_NOW = new Date('2025-01-01T12:00:00Z').getTime();

const DEMO_ITEMS: MenuItemCardData[] = [
  {
    id: 'demo-1',
    name: 'Coastal Grilled King Salmon',
    description: 'Herb-crusted Atlantic salmon fillet, asparagus spears, saffron-infused lemon butter emulsion.',
    category: 'Signature Grills',
    pricePaise: 125000,
    currency: 'INR',
    imageUrl: undefined,
    isVeg: false,
    allergens: ['Fish', 'Dairy'],
    available: true,
  },
  {
    id: 'demo-2',
    name: 'Charcoal Paneer Tikka',
    description: 'Smoky charcoal-grilled cottage cheese, mint chutney, pickled onions.',
    category: 'Signature Grills',
    pricePaise: 69000,
    currency: 'INR',
    isVeg: true,
    allergens: ['Dairy'],
    available: true,
  },
  {
    id: 'demo-3',
    name: 'Espresso Tiramisu Jar',
    description: 'Unavailable while the pastry kitchen restocks mascarpone.',
    category: 'Desserts',
    pricePaise: 52000,
    currency: 'INR',
    isVeg: false,
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    available: false,
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-line pb-10">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}

function ButtonShowcase() {
  const [loading, setLoading] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  return (
    <Section title="Button">
      <Row>
        <Button variant="primary">Place order</Button>
        <Button variant="secondary">Add more items</Button>
        <Button variant="ghost">Not now</Button>
        <Button variant="danger">Remove</Button>
        <Button variant="chip" pressed={pressed} onClick={() => setPressed((p) => !p)}>
          Veg only
        </Button>
      </Row>
      <Row>
        <Button variant="primary" size="lg">
          Pay ₹2,952
        </Button>
        <Button variant="primary" size="icon" aria-label="Increase">
          +
        </Button>
        <Button variant="primary" loading={loading} onClick={() => setLoading((l) => !l)}>
          {loading ? 'Placing your order…' : 'Toggle loading'}
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="primary" href="/dev/guest-kit">
          As a link
        </Button>
      </Row>
    </Section>
  );
}

function InputShowcase() {
  const [note, setNote] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [qty, setQty] = React.useState(0);

  return (
    <Section title="Input family">
      <Row className="items-start">
        <div className="w-64">
          <Field label="Room number" hint="From your key card">
            <Input placeholder="304" />
          </Field>
        </div>
        <div className="w-64">
          <Field label="Note for the kitchen" error="Kitchen notes can be up to 500 characters.">
            <Input invalid placeholder="e.g. no chilli" />
          </Field>
        </div>
        <div className="w-72">
          <Field label="Details (optional)" optional>
            <Textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us more" />
          </Field>
        </div>
      </Row>
      <Row>
        <div className="w-72">
          <SearchField value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Search dishes" />
        </div>
        <NumberStepper value={qty} onChange={setQty} label="Avocado Tartine" />
        <NumberStepper value={0} onChange={() => {}} label="Coconut Water" size="sm" />
      </Row>
    </Section>
  );
}

function CardShowcase() {
  return (
    <Section title="Card">
      <Row className="items-stretch">
        {(['default', 'raised', 'glass', 'outline'] as const).map((tone) => (
          <Card key={tone} tone={tone} interactive className="w-56">
            <CardHeader>
              <CardTitle>Grand Azure</CardTitle>
              <CardDescription>tone: {tone}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">Deluxe Garden Sanctuary, Room 304.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="md">
                View
              </Button>
            </CardFooter>
          </Card>
        ))}
      </Row>
    </Section>
  );
}

function SheetShowcase() {
  const [open, setOpen] = React.useState(false);
  return (
    <Section title="Sheet">
      <Row>
        <Button onClick={() => setOpen(true)}>Open item sheet</Button>
      </Row>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Artisan Avocado Sourdough Tartine"
        description="₹550 each"
        footer={
          <Button variant="primary" fullWidth size="lg">
            Add to order
          </Button>
        }
      >
        <p className="text-sm text-ink-muted">
          Crushed Hass avocado, organic microgreens, heirloom cherry tomatoes, cold-pressed olive drizzle.
        </p>
      </Sheet>
    </Section>
  );
}

function ToastShowcase() {
  const { show } = useToast();
  const tones: ToastTone[] = ['success', 'error', 'info', 'warning'];
  return (
    <Section title="Toast">
      <Row>
        {tones.map((tone) => (
          <Button
            key={tone}
            variant="secondary"
            onClick={() =>
              show({
                tone,
                title: tone === 'success' ? 'Added to your order' : tone === 'error' ? "We couldn't connect" : tone === 'warning' ? 'Taking a little longer than usual' : 'A fresh version is ready',
                description: tone === 'success' ? undefined : 'Demo toast for the guest kit mirror review.',
                action: tone === 'success' ? { label: 'View cart', onClick: () => {} } : undefined,
              })
            }
          >
            Show {tone}
          </Button>
        ))}
      </Row>
    </Section>
  );
}

function SkeletonShowcase() {
  return (
    <Section title="Skeleton">
      <div className="flex flex-col gap-6">
        <SkeletonText lines={3} className="max-w-sm" />
        <SkeletonMenuItem />
        <div className="max-w-xs">
          <SkeletonTimeline steps={3} />
        </div>
        <div className="max-w-56">
          <SkeletonCard />
        </div>
      </div>
    </Section>
  );
}

function StatusTimelineShowcase() {
  // Fixed reference point, not Date.now(): this only demos relative offsets
  // ("6 min ago" etc.), so it doesn't need real time — and Date.now() here
  // would differ between SSR and hydration, causing a hydration mismatch.
  const now = FIXED_SHOWCASE_NOW;
  const timeline = React.useMemo(
    () =>
      buildOrderTimeline({
        status: 'preparing',
        createdAt: new Date(now - 6 * 60_000).toISOString(),
        updatedAt: new Date(now - 60_000).toISOString(),
      }),
    [now]
  );
  const cancelled = React.useMemo(
    () =>
      buildOrderTimeline({
        status: 'cancelled',
        createdAt: new Date(now - 20 * 60_000).toISOString(),
        updatedAt: new Date(now - 15 * 60_000).toISOString(),
      }),
    [now]
  );

  return (
    <Section title="Status timeline &amp; pill">
      <Row>
        <StatusPill tone="progress" live>
          Being prepared
        </StatusPill>
        <StatusPill tone="success">Delivered</StatusPill>
        <StatusPill tone="danger">Cancelled</StatusPill>
        <StatusPill tone="warning">Reconnecting…</StatusPill>
        <StatusPill tone="neutral">Unpaid</StatusPill>
      </Row>
      <Row className="items-start">
        <div className="w-72">
          <StatusTimeline steps={timeline.steps} currentKey={timeline.currentKey} timeZone="Asia/Kolkata" live announce={false} />
        </div>
        <div className="w-72">
          <StatusTimeline steps={cancelled.steps} currentKey={cancelled.currentKey} terminal={cancelled.terminal} timeZone="Asia/Kolkata" />
        </div>
      </Row>
      <div className="max-w-md">
        <StatusTimeline steps={timeline.steps} currentKey={timeline.currentKey} timeZone="Asia/Kolkata" orientation="horizontal" />
      </div>
    </Section>
  );
}

function MenuItemCardShowcase() {
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});

  function setQty(id: string, next: number) {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, next) }));
  }

  return (
    <Section title="Menu item card">
      <div className="flex max-w-md flex-col">
        {DEMO_ITEMS.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={quantities[item.id] ?? 0}
            canOrder
            onOpen={() => {}}
            onAdd={() => setQty(item.id, 1)}
            onIncrement={() => setQty(item.id, (quantities[item.id] ?? 0) + 1)}
            onDecrement={() => setQty(item.id, (quantities[item.id] ?? 0) - 1)}
          />
        ))}
      </div>
      <Row className="items-stretch">
        {DEMO_ITEMS.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            layout="feature"
            quantity={quantities[item.id] ?? 0}
            canOrder={false}
            onOpen={() => {}}
            onAdd={() => {}}
            onIncrement={() => {}}
            onDecrement={() => {}}
          />
        ))}
      </Row>
    </Section>
  );
}

function KitShowcaseContent() {
  return (
    <div className="flex flex-col gap-10">
      <ButtonShowcase />
      <InputShowcase />
      <CardShowcase />
      <SheetShowcase />
      <ToastShowcase />
      <SkeletonShowcase />
      <StatusTimelineShowcase />
      <MenuItemCardShowcase />
    </div>
  );
}

function ThemeColumn({ theme, label }: { theme: 'dark' | 'light'; label: string }) {
  return (
    <div data-theme={theme} className={cn('flex-1 rounded-xl p-6', theme === 'dark' && 'dark')}>
      <div className="rounded-xl bg-bg p-6 text-ink">
        <p className="mb-6 text-eyebrow font-semibold uppercase text-accent">{label}</p>
        <KitShowcaseContent />
      </div>
    </div>
  );
}

export default function GuestKitDevPage() {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-surface-3 px-4 py-10">
        <div className="mx-auto mb-8 max-w-5xl">
          <h1 className="font-display text-display-md text-ink">Guest kit — mirror review</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Every component from <code>components/ui/guest-kit</code>, rendered in both themes for the M3 mirror review. Not
            available in production.
          </p>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row">
          <ThemeColumn theme="dark" label="Dark (default)" />
          <ThemeColumn theme="light" label="Sunlight mode" />
        </div>
      </div>
    </ToastProvider>
  );
}
