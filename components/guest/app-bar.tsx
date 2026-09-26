'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Sheet } from '@/components/ui/guest-kit/sheet';
import { Button } from '@/components/ui/guest-kit/button';
import { clearSession, useGuestSession } from '@/lib/guest/session';
import { GUEST_COPY } from '@/lib/guest/copy';
import { ThemeToggle } from './theme-toggle';
import { ResilientImage } from './resilient-image';
import { GUEST_TID } from './test-ids';
import type { GuestSession, PublicHotel } from '@/lib/guest/types';

function RoomChip({ session, hotelSlug }: { session: GuestSession | null; hotelSlug: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!session) return null;

  function handleLeave() {
    clearSession();
    setOpen(false);
    router.push(`/h/${hotelSlug}/rejoin`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid={GUEST_TID.roomChip}
        className="rounded-full border border-line-strong bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent/40 focus-ring"
      >
        {session.roomNumber}
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={session.roomNumber} description={session.guestName}>
        <Button variant="ghost" fullWidth onClick={handleLeave} leading={<LogOut aria-hidden className="size-4" strokeWidth={1.75} />}>
          {GUEST_COPY.session.notYou}
        </Button>
      </Sheet>
    </>
  );
}

export function AppBar({ hotel }: { hotel: PublicHotel }) {
  const session = useGuestSession(hotel.id);

  return (
    <header
      data-testid={GUEST_TID.appBar}
      className="glass sticky top-0 z-30"
      style={{ borderBottom: '1px solid color-mix(in oklab, var(--rb-hotel) 30%, transparent)' }}
    >
      <div className="mx-auto flex h-14 max-w-[480px] items-center justify-between px-4">
        <Link href={`/h/${hotel.slug}`} className="flex min-w-0 items-center gap-2 rounded-md focus-ring">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-hotel">
            {hotel.logoUrl ? (
              <ResilientImage
                src={hotel.logoUrl}
                alt=""
                width={32}
                height={32}
                className="size-full object-cover"
                fallbackClassName="grid size-full place-items-center"
                fallback={<span className="font-display text-xs text-hotel">{hotel.shortName.charAt(0)}</span>}
              />
            ) : (
              <span className="font-display text-xs text-hotel">{hotel.shortName.charAt(0)}</span>
            )}
          </span>
          <span className="truncate font-display text-base text-ink">{hotel.name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <RoomChip session={session} hotelSlug={hotel.slug} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
