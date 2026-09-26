# 03 · Design system: tokens, type, motion, and the guest kit

The brief: **quiet luxury, dark first.** It should feel like a five-star concierge desk at night, with deep midnight
surfaces, warm ivory type, one champagne-gold accent and nothing loud. It builds on the tokens in `docs/DESIGN.md`
(midnight slate `#0f172a`, amber gold `#f59e0b` / `#d97706`, emerald `#059669`, rose `#e11d48`, radii 6/12/16/full,
Playfair and Inter), extended into semantic tokens that work in both themes.

**Rule for every guest screen:** use only these tokens and the kit. No raw hex values in JSX, no `dark:` or
`light:` variants in kit components (the semantic tokens flip on their own), and no one-off buttons, cards or badges.

## 1. `components/ui/tokens/tokens.css` (ready to paste)

This is a shared file (@m2 @m3), so the first PR containing it needs M3's approval.

```css
/* components/ui/tokens/tokens.css
   ResortBrain design tokens — shared by the guest kit (M2) and the ops kit (M3).
   Dark is the default theme. [data-theme="light"] is "Sunlight mode". Print is always light. */

@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));
@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *));

:root,
[data-theme="dark"] {
  color-scheme: dark;

  /* surfaces */
  --rb-bg: #070b14;
  --rb-bg-elevated: #0b1120;
  --rb-surface-1: #0f1626;
  --rb-surface-2: #151e31;
  --rb-surface-3: #1c2740;
  --rb-line: rgb(244 241 234 / 0.08);
  --rb-line-strong: rgb(244 241 234 / 0.14);
  --rb-scrim: rgb(3 6 12 / 0.64);

  /* ink */
  --rb-ink: #f4f1ea;          /* warm ivory — ~17:1 on bg */
  --rb-ink-muted: #a9b1c3;    /* ~8.5:1 on surface-1 */
  --rb-ink-subtle: #7a8499;   /* ~4.8:1 on surface-1 — minimum for text */

  /* brand */
  --rb-accent: #f2bd5c;       /* champagne gold for text, icons, rings */
  --rb-accent-soft: rgb(242 189 92 / 0.12);
  --rb-accent-ink: #1a1206;   /* text on gold */
  --rb-cta-bg: linear-gradient(135deg, #f8d58b 0%, #f2bd5c 45%, #d99a2b 100%);
  --rb-cta-ink: #1a1206;
  --rb-hotel: #f2bd5c;        /* overridden per hotel by the guest layout (inline style) */

  /* feedback */
  --rb-success: #34d399;  --rb-success-soft: rgb(52 211 153 / 0.12);
  --rb-danger: #fb7185;   --rb-danger-soft: rgb(251 113 133 / 0.12);
  --rb-warning: #fbbf24;  --rb-warning-soft: rgb(251 191 36 / 0.12);
  --rb-info: #7dd3fc;     --rb-info-soft: rgb(125 211 252 / 0.12);

  /* food marks (FSSAI convention: shown on a white chip in both themes) */
  --rb-veg: #16a34a;
  --rb-nonveg: #a0522d;

  /* elevation */
  --rb-shadow-1: inset 0 1px 0 rgb(255 255 255 / 0.04), 0 1px 2px rgb(0 0 0 / 0.4);
  --rb-shadow-2: inset 0 1px 0 rgb(255 255 255 / 0.05), 0 12px 32px -12px rgb(0 0 0 / 0.6);
  --rb-shadow-3: 0 -12px 48px -8px rgb(0 0 0 / 0.7);
  --rb-glow: 0 0 0 1px rgb(242 189 92 / 0.35), 0 8px 30px -8px rgb(242 189 92 / 0.45);
  --rb-focus: 0 0 0 2px var(--rb-bg), 0 0 0 4px var(--rb-accent);
}

[data-theme="light"] {
  color-scheme: light;

  --rb-bg: #faf8f4;
  --rb-bg-elevated: #ffffff;
  --rb-surface-1: #ffffff;
  --rb-surface-2: #f3f0ea;
  --rb-surface-3: #eae5dc;
  --rb-line: rgb(15 23 42 / 0.1);
  --rb-line-strong: rgb(15 23 42 / 0.18);
  --rb-scrim: rgb(15 23 42 / 0.4);

  --rb-ink: #0b1220;
  --rb-ink-muted: #3f4a5e;
  --rb-ink-subtle: #5b667a;

  --rb-accent: #b45309;
  --rb-accent-soft: rgb(217 119 6 / 0.1);
  --rb-accent-ink: #faf8f4;
  --rb-cta-bg: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);   /* sunlight: midnight CTA, max contrast */
  --rb-cta-ink: #faf8f4;

  --rb-success: #047857;  --rb-success-soft: rgb(5 150 105 / 0.1);
  --rb-danger: #be123c;   --rb-danger-soft: rgb(225 29 72 / 0.08);
  --rb-warning: #b45309;  --rb-warning-soft: rgb(217 119 6 / 0.1);
  --rb-info: #0369a1;     --rb-info-soft: rgb(3 105 161 / 0.08);

  --rb-shadow-1: 0 1px 2px rgb(15 23 42 / 0.06);
  --rb-shadow-2: 0 12px 32px -16px rgb(15 23 42 / 0.25);
  --rb-shadow-3: 0 -12px 40px -12px rgb(15 23 42 / 0.25);
  --rb-glow: 0 0 0 1px rgb(180 83 9 / 0.3), 0 8px 24px -10px rgb(180 83 9 / 0.35);
}

@media print {
  :root, [data-theme] {
    --rb-bg: #ffffff; --rb-surface-1: #ffffff; --rb-surface-2: #ffffff;
    --rb-ink: #000000; --rb-ink-muted: #333333; --rb-ink-subtle: #555555;
    --rb-line: #cccccc; --rb-line-strong: #999999; --rb-accent: #000000;
  }
}

@theme inline {
  --color-bg: var(--rb-bg);
  --color-bg-elevated: var(--rb-bg-elevated);
  --color-surface: var(--rb-surface-1);
  --color-surface-2: var(--rb-surface-2);
  --color-surface-3: var(--rb-surface-3);
  --color-line: var(--rb-line);
  --color-line-strong: var(--rb-line-strong);
  --color-scrim: var(--rb-scrim);
  --color-ink: var(--rb-ink);
  --color-ink-muted: var(--rb-ink-muted);
  --color-ink-subtle: var(--rb-ink-subtle);
  --color-accent: var(--rb-accent);
  --color-accent-soft: var(--rb-accent-soft);
  --color-accent-ink: var(--rb-accent-ink);
  --color-cta-ink: var(--rb-cta-ink);
  --color-hotel: var(--rb-hotel);
  --color-success: var(--rb-success);
  --color-success-soft: var(--rb-success-soft);
  --color-danger: var(--rb-danger);
  --color-danger-soft: var(--rb-danger-soft);
  --color-warning: var(--rb-warning);
  --color-warning-soft: var(--rb-warning-soft);
  --color-info: var(--rb-info);
  --color-info-soft: var(--rb-info-soft);
  --color-veg: var(--rb-veg);
  --color-nonveg: var(--rb-nonveg);

  --shadow-rb-1: var(--rb-shadow-1);
  --shadow-rb-2: var(--rb-shadow-2);
  --shadow-rb-3: var(--rb-shadow-3);
  --shadow-glow: var(--rb-glow);
  --shadow-focus: var(--rb-focus);

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-playfair), ui-serif, Georgia, "Times New Roman", serif;
}

@theme {
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --text-display-xl: clamp(2.75rem, 1.6rem + 5vw, 5rem);
  --text-display-xl--line-height: 1.02;
  --text-display-xl--letter-spacing: -0.02em;
  --text-display-lg: clamp(2rem, 1.4rem + 2.6vw, 3.25rem);
  --text-display-lg--line-height: 1.08;
  --text-display-lg--letter-spacing: -0.015em;
  --text-display-md: 1.75rem;
  --text-display-md--line-height: 1.15;
  --text-eyebrow: 0.75rem;
  --text-eyebrow--line-height: 1.35;
  --text-eyebrow--letter-spacing: 0.08em;

  --ease-out-soft: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --animate-shimmer: rb-shimmer 1.4s linear infinite;
  --animate-rise: rb-rise 240ms var(--ease-out-soft) both;
  --animate-fade: rb-fade 160ms var(--ease-out-soft) both;
  --animate-sheet-up: rb-sheet-up 260ms var(--ease-out-soft) both;
  --animate-pulse-ring: rb-pulse-ring 1.8s var(--ease-out-soft) infinite;
  --animate-check: rb-check 420ms var(--ease-out-soft) both;

  @keyframes rb-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @keyframes rb-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes rb-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rb-sheet-up { from { transform: translateY(100%); } to { transform: none; } }
  @keyframes rb-pulse-ring {
    0% { box-shadow: 0 0 0 0 rgb(242 189 92 / 0.55); }
    70% { box-shadow: 0 0 0 10px rgb(242 189 92 / 0); }
    100% { box-shadow: 0 0 0 0 rgb(242 189 92 / 0); }
  }
  @keyframes rb-check { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
}

@utility bg-cta { background-image: var(--rb-cta-bg); color: var(--rb-cta-ink); }
@utility glass {
  background-color: color-mix(in oklab, var(--rb-bg) 72%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  backdrop-filter: blur(16px) saturate(140%);
}
@utility focus-ring { outline: none; box-shadow: var(--rb-focus); }
@utility tabular { font-variant-numeric: tabular-nums; }
@utility safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 0px); }
@utility no-print { @media print { display: none !important; } }
@utility print-only { display: none; @media print { display: block; } }

@layer base {
  html { -webkit-text-size-adjust: 100%; text-rendering: optimizeLegibility; }
  body { background: var(--rb-bg); color: var(--rb-ink); }
  :focus-visible { outline: none; box-shadow: var(--rb-focus); border-radius: var(--radius-sm); }
  ::selection { background: var(--rb-accent-soft); }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important; scroll-behavior: auto !important;
    }
  }
}
```

> **Verified:** on 26 Sep 2026 this exact file compiled with the repo's Tailwind v4 (`@tailwindcss/postcss`). All of
> these resolved: `bg-surface`, `text-ink-muted`, `shadow-rb-2`, `rounded-xl`, `text-display-xl`,
> `animate-shimmer`, `bg-cta`, `glass`, `focus-ring`, `safe-bottom`, `no-print`, `print-only`, `dark:*`, `light:*`,
> `border-danger/30` and the keyframes. After pasting, still confirm with `npm run build` and one rendered page.

## 2. Per-hotel accent (multi-tenant branding)

The guest layout sets `style={{ '--rb-hotel': hotel.accent }}` on its wrapper. The hotel accent appears **only** in
the hotel crest ring, the hero gradient on hotel home, and the app-bar hairline. The product gold stays the action
colour everywhere, so the UI keeps one voice. Seed accents are listed in doc 07.

## 3. Typography

| Role | Token / class | Face | Use |
|------|---------------|------|-----|
| Hero (landing) | `text-display-xl font-display font-semibold` | Playfair Display | one per page |
| Section title | `text-display-lg font-display` | Playfair Display | landing sections |
| Screen title | `text-display-md font-display` | Playfair Display | guest page titles, hotel name |
| Title | `text-xl font-semibold` | Inter | card titles |
| Body | `text-base` (16 px minimum on inputs, so iOS doesn't zoom) | Inter | everything else |
| Small | `text-sm text-ink-muted` | Inter | meta and hints |
| Eyebrow | `text-eyebrow uppercase font-semibold text-accent` | Inter | section labels |
| Money | `tabular font-semibold` | Inter | every amount |

Load fonts with `next/font/google` in `app/layout.tsx` (doc 02 §5): `Inter` (variable) and `Playfair_Display`
(weights 500 to 700, variable), both with `display: 'swap'`. Don't add other fonts.

## 4. Motion

- **Standard:** 160 ms `ease-out-soft` for colour, opacity and small transforms. The playbook's "transitions about
  150 ms perceived" budget comes from here.
- **Sheet:** 260 ms slide-up with a 160 ms scrim fade.
- **Status advance:** the new step's dot fills, the connector line grows over 400 ms, and the current dot runs
  `animate-pulse-ring`.
- **Success:** checkmark stroke draw (`animate-check`) plus a single 6 ms haptic via `navigator.vibrate?.(6)` where
  it's supported.
- **Press:** `active:scale-[0.98]` on buttons and interactive cards.
- **Reduced motion:** everything collapses to instant (handled in `tokens.css`). Don't gate content behind an
  animation.

## 5. Layout and iconography

- **Guest app column:** `mx-auto w-full max-w-[480px]` with a 16 px gutter. On ≥ 1024 px the column sits centred
  over a softly lit background (a radial `--rb-hotel` glow at 8 % opacity), so a laptop demo still looks
  intentional.
- **App bar:** 56 px, glass, sticky. **Bottom nav:** 64 px plus `safe-bottom`, glass, five items, 44 px or larger
  targets.
- **Spacing:** Tailwind's 4 px scale. Sections are 24 px apart, cards use 16 px padding (20 px on ≥ 390 px),
  landing sections use `py-24 md:py-32`.
- **Icons:** `lucide-react`, named imports only, 20 px, `strokeWidth={1.75}`, `aria-hidden` unless the icon is the
  only label.
- **Images:** always `next/image` with explicit `sizes`. Menu rows are 96 × 96 at `rounded-lg`, feature cards are
  16:10. Only the first two images above the fold get `priority`. On error, show a tokenised gradient tile with the
  dish's initial in Playfair.
- **Food marks:** a 14 px white rounded square with a 1.5 px border. Veg is a green border with a green dot;
  non-veg is a brown border with a brown ▲. Each carries an `aria-label` ("Vegetarian" / "Non-vegetarian").

## 6. The guest kit: 8 components (`components/ui/guest-kit/`)

General rules: one file per component, named exports, `'use client'` only where the component needs state or
handlers, `forwardRef` isn't needed (React 19 passes `ref` as a prop), every component accepts `className`, and
classes merge with `lib/cn.ts`. Variants are plain objects mapping variant to classes, with no `cva` dependency.
Every interactive element must be ≥ 44 × 44 px, show a visible `:focus-visible` ring, and keep its disabled and
loading states perceivable.

### 6.1 `button.tsx` · Button

```ts
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'chip';
type ButtonSize = 'md' | 'lg' | 'icon';
type ButtonProps = {
  variant?: ButtonVariant;      // default 'primary'
  size?: ButtonSize;            // default 'md' → h-11 px-5 ; 'lg' → h-13 px-6 text-base ; 'icon' → size-11
  loading?: boolean;            // spinner replaces leading icon, aria-busy, disabled, width preserved
  pressed?: boolean;            // chip toggle → aria-pressed
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;                // renders next/link <Link> with identical styling
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

Variants:

- **primary:** `bg-cta shadow-glow font-semibold rounded-full`. Hover lifts the glow; active is `scale-[0.98]`.
- **secondary:** `bg-surface-2 text-ink border border-line-strong rounded-full`.
- **ghost:** `text-ink-muted hover:text-ink hover:bg-surface-2 rounded-full`.
- **danger:** `bg-danger-soft text-danger border border-danger/30 rounded-full`.
- **chip:** `h-11 px-4 rounded-full border border-line bg-surface text-ink-muted`. When pressed it becomes
  `bg-accent-soft text-accent border-accent/40`.

Disabled is `opacity-50 cursor-not-allowed` and the button isn't focusable when loading. The default
`type="button"` avoids accidental form submits.

### 6.2 `input.tsx` · Field, Input, Textarea, SearchField, NumberStepper

```ts
Field({ label, hint?, error?, htmlFor, children, optional? })   // wires aria-describedby / aria-invalid
Input(props: InputHTMLAttributes & { invalid?: boolean })        // h-12 rounded-md bg-surface-2 border-line text-base
Textarea(props & { maxLength: number; showCount?: boolean })     // live "123 / 500" counter, polite
SearchField({ value, onChange, placeholder, onClear })           // leading search icon, clear button (44px)
NumberStepper({ value, min=0, max=20, onChange, label, size?: 'sm' | 'md' })
  // [-] value [+] ; buttons 44px ; aria-label "Decrease quantity of {label}" ; value in aria-live="polite"
  // at min=0 the minus becomes a trash icon with label "Remove {label}"
```

### 6.3 `card.tsx` · Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

```ts
Card({ tone?: 'default' | 'raised' | 'glass' | 'outline'; interactive?: boolean; as?: 'div' | 'article' | 'section' | 'li' })
// default: bg-surface border border-line rounded-lg shadow-rb-1
// raised:  bg-surface-2 shadow-rb-2
// glass:   glass border border-line
// outline: bg-transparent border border-line-strong
// interactive: hover:border-line-strong active:scale-[0.99] transition, cursor-pointer, focus ring
```

### 6.4 `sheet.tsx` · Sheet

Build it on the native `<dialog>` with `showModal()`, which gives focus trapping, Escape handling and top-layer
rendering for free.

```ts
Sheet({ open, onOpenChange, title, description?, children, footer?, size?: 'auto' | 'tall' | 'full', dismissible?: boolean })
```

- Below 768 px it's a bottom sheet: `rounded-t-xl`, a drag handle, `animate-sheet-up`, max-height 92 dvh, a
  scrollable body, a sticky footer and `safe-bottom`.
- At 768 px and up it's a centred panel, `max-w-lg rounded-xl`.
- The backdrop is `bg-scrim` with `backdrop-blur-sm`, and clicking it closes the sheet when `dismissible`.
- Lock body scroll while open and restore focus to the trigger on close.
- Swipe down more than 80 px (pointer events) closes it. This is optional polish, so skip it if it gets flaky.
- The title renders as an `<h2>` linked through `aria-labelledby`.

### 6.5 `toast.tsx` · ToastProvider, useToast

```ts
const { show, dismiss } = useToast();
show({ title: string; description?: string; tone?: 'success' | 'error' | 'info' | 'warning';
       action?: { label: string; onClick: () => void }; durationMs?: number /* 4000; error 6000 */ });
```

- Toasts stack at most three deep, sit above the bottom nav (`bottom-[calc(64px+env(safe-area-inset-bottom)+12px)]`),
  and pause while hovered or focused.
- The region uses `role="status"` / `aria-live="polite"` for everything except errors, which use `role="alert"`.
- Each toast has a left accent bar in the tone colour, a lucide icon and a close button.

### 6.6 `skeleton.tsx` · Skeleton, SkeletonText, SkeletonMenuItem, SkeletonTimeline, SkeletonCard

- The base is `bg-surface-2 rounded-md` with a shimmer gradient using `var(--rb-line-strong)` and
  `animate-shimmer`, and `aria-hidden="true"`.
- Presets match the real layouts exactly (same heights) so there's **zero layout shift** when content arrives.
- The container announces "Loading…" once through a visually-hidden `role="status"`.

### 6.7 `status-timeline.tsx` · StatusTimeline, StatusPill

```ts
type TimelineStep = { key: string; label: string; hint?: string; at?: string /* ISO UTC */ };
StatusTimeline({
  steps: TimelineStep[];            // from lib/guest/status.ts
  currentKey: string;
  terminal?: { tone: 'danger' | 'neutral'; label: string; hint?: string; at?: string }; // cancelled / rejected
  orientation?: 'vertical' | 'horizontal';   // vertical on tracking pages, horizontal (compact) in cards
  timeZone: string;                 // hotel timezone for timestamps
  live?: boolean;                   // current dot pulses
  announce?: boolean;               // aria-live polite: "Your order is now being prepared"
});
StatusPill({ tone: 'neutral' | 'progress' | 'success' | 'danger' | 'warning'; live?: boolean; children });
```

- Render it as an `<ol>`, with `aria-current="step"` on the current step.
- **Done** steps show an emerald check in a filled circle and a solid connector.
- The **current** step is a gold ring that pulses when `live`, with the label in `text-ink font-semibold` and its
  hint underneath.
- **Upcoming** steps are hollow with a `line` border, a dashed connector and an `ink-subtle` label.
- Timestamps sit right-aligned in `text-sm tabular text-ink-subtle`, formatted in the hotel timezone.
- A **terminal** state replaces the remaining steps with one danger (or neutral) row that has an icon and a hint.
- When `currentKey` changes, animate the connector growing into the new step.

### 6.8 `menu-item-card.tsx` · MenuItemCard

```ts
MenuItemCard({
  item: { id; name; description?; pricePaise; currency; imageUrl?; isVeg; allergens: string[]; available: boolean };
  layout?: 'row' | 'feature';       // row: text left, 96px image right (menu list) · feature: 16:10 image top (Chef's picks, landing)
  quantity: number;                 // from cart; 0 → "Add" button, >0 → NumberStepper
  canOrder: boolean;                // false (no session) → button reads "View" and opens detail
  onOpen(): void; onAdd(): void; onIncrement(): void; onDecrement(): void;
  priority?: boolean;
});
```

- Structure: food mark, name (`font-display text-lg`), a two-line clamped description, allergen chips (at most two
  plus "+N"), price (`formatMoney`, `tabular`), then the Add button or stepper.
- In the row layout, the Add button overlaps the image's bottom edge, the way premium delivery apps do it.
- The whole card is the open target (`button` semantics) except the Add and stepper controls, which call
  `stopPropagation`.
- Unavailable items are dimmed with an "Unavailable right now" pill and no add control.
- Test IDs: `menu-item-{id}`, `menu-add-{id}`, `menu-qty-{id}`.

## 7. Kit showcase (`/dev/guest-kit`)

A single page that renders every component in every variant and state, in both themes side by side. It's used for
the M3 mirror review and the 20-minute pairing sessions. In production it returns `notFound()`.

## 8. Design acceptance

- [ ] All 8 components exist, are typed, and show on `/dev/guest-kit` in dark and Sunlight.
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}\b" app/(guest) components/guest components/ui/guest-kit` returns nothing (hex
      values only in `tokens.css`, the seed, and ImageResponse icon files).
- [ ] Contrast: body text ≥ 4.5:1 and large text ≥ 3:1 in both themes (check with Lighthouse or axe).
- [ ] Every interactive element measures ≥ 44 × 44 px at a 360 px viewport.
- [ ] Reduced motion leaves no animation or transition running.
