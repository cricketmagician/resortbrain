# Design System & Token Architecture (DESIGN.md)

## Design Principles
1. **Speed First**: Sub-2s first contentful paint on 4G networks.
2. **Clarity in High-Stress Environments**: Kitchens are busy and damp; staff screens feature large tap targets (minimum 48px), high contrast (meeting WCAG AAA), and clear audio cues.
3. **Luxury Hotel Aesthetics**: Warm luxury neutrals, deep slate accents, gold/amber highlights, smooth glassmorphism, and elegant typography (Playfair / Inter).

## Token Specifications
- **Brand Colors**:
  - `brand-primary`: `#0f172a` (Deep Midnight Slate)
  - `brand-accent`: `#d97706` / `#f59e0b` (Warm Amber Gold)
  - `brand-surface`: `#ffffff` / `#f8fafc` (Alabaster Snow)
  - `brand-emerald`: `#059669` (Success & Delivered)
  - `brand-rose`: `#e11d48` (Urgent & SLA Escalated)
- **Radii**:
  - `sm`: 6px
  - `md`: 12px
  - `lg`: 16px
  - `full`: 9999px
- **Component Kit Breakdown**:
  - **Guest Kit (Member 2)**: Button, Input, Card, Sheet, Toast, Skeleton, Status Timeline, Menu Item Card.
  - **Ops Kit (Member 3)**: Table, Badge, Tabs, Dialog, Chart, Queue List, KPI Tile, Empty State.
