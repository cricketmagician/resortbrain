'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';

type Theme = 'dark' | 'light';

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem('rb-theme', theme);
  } catch {
    // ignore
  }
  document.cookie = `rb-theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // The pre-paint boot script (app/layout.tsx) already set this on <html> before React ran —
    // this just syncs the button's own state with what's already on screen.
    const current: Theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    persistTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? GUEST_COPY.theme.toSunlight : GUEST_COPY.theme.toDark}
      data-testid={GUEST_TID.themeToggle}
      className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-ring"
    >
      {theme === 'dark' ? <Sun aria-hidden className="size-5" strokeWidth={1.75} /> : <Moon aria-hidden className="size-5" strokeWidth={1.75} />}
    </button>
  );
}
