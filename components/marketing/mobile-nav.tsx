'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/guest-kit/button';

interface NavItem {
  href: string;
  label: string;
}

function MobileNavOverlay({
  navItems,
  pricing,
  cta,
  demoHref,
  onClose,
}: {
  navItems: readonly NavItem[];
  pricing: NavItem;
  cta: string;
  demoHref: string;
  onClose: () => void;
}) {
  return (
    <div className="dark fixed inset-0 z-50" data-theme="dark">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div className="animate-fade absolute inset-y-0 right-0 flex w-full max-w-xs flex-col gap-1 border-l border-line bg-surface p-6 shadow-rb-3">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-lg text-ink">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-2 focus-ring"
          >
            <X aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="rounded-md px-2 py-3 text-base text-ink-muted hover:bg-surface-2 hover:text-ink focus-ring"
          >
            {item.label}
          </a>
        ))}
        <Link href={pricing.href} onClick={onClose} className="rounded-md px-2 py-3 text-base text-ink-muted hover:bg-surface-2 hover:text-ink focus-ring">
          {pricing.label}
        </Link>
        <div className="mt-4">
          <Button href={demoHref} variant="primary" size="lg" fullWidth onClick={onClose}>
            {cta}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileNav({
  navItems,
  pricing,
  cta,
  demoHref,
}: {
  navItems: readonly NavItem[];
  pricing: NavItem;
  cta: string;
  demoHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // document.body doesn't exist during SSR, so this can only be known once mounted on the
  // client — not state render could derive itself.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-2 focus-ring"
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.75} />
      </button>

      {/* Portalled to <body> — a position:fixed descendant of the glass (backdrop-filter) header
          would otherwise be positioned relative to the header instead of the viewport, since
          backdrop-filter makes an element a containing block for fixed descendants. */}
      {open &&
        mounted &&
        createPortal(
          <MobileNavOverlay navItems={navItems} pricing={pricing} cta={cta} demoHref={demoHref} onClose={() => setOpen(false)} />,
          document.body
        )}
    </div>
  );
}
