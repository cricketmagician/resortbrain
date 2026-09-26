'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/guest-kit/button';
import { GUEST_TID } from './test-ids';

export interface MenuCategory {
  slug: string;
  name: string;
}

export function CategoryNav({ categories }: { categories: MenuCategory[] }) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`category-${c.slug}`))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const slug = visible[0]?.target.getAttribute('data-category-slug');
        if (slug) setActiveSlug(slug);
      },
      { rootMargin: '-120px 0px -70% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (!activeSlug) return;
    const chip = railRef.current?.querySelector<HTMLElement>(`[data-chip-slug="${activeSlug}"]`);
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeSlug]);

  function handleClick(slug: string) {
    setActiveSlug(slug);
    document.getElementById(`category-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div ref={railRef} className="glass sticky top-14 z-20 -mx-4 flex gap-2 overflow-x-auto px-4 py-2.5">
      {categories.map((category) => (
        <Button
          key={category.slug}
          variant="chip"
          pressed={activeSlug === category.slug}
          onClick={() => handleClick(category.slug)}
          data-chip-slug={category.slug}
          data-testid={GUEST_TID.menuCat(category.slug)}
          className="shrink-0"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
