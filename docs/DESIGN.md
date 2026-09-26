# DESIGN SYSTEM SPECIFICATION: GRAND AZURE OPS
**Version 3.0 | Design System Captain: Member 3 (Operations & Control Co-Lead)**

---

## 1. Aesthetic Philosophy & Visual Tone
Grand Azure Operations is built as an enterprise-grade, high-density, mission-critical operations platform. The visual tone evokes the precision of Bloomberg Terminals combined with the tactile elegance of Linear and Apple Pro apps.

### Core Principles
1. **Default Dark Mode First**: Engineered for 24/7 dimly-lit kitchen pass-lines, front-desk evening counters, and manager night shifts.
2. **Functional Color Only**: Colors are strictly reserved for operational urgency (Emerald = On-track, Amber = Warning < 5m SLA, Rose = Breached/Critical, Cyan = Active Selection).
3. **Zero Layout Shifts (CLS = 0)**: Rigid aspect ratios, pre-sized ticket cards, and skeleton placeholders prevent visual jumps during data hydration.
4. **Ergonomic Tactility**: Designed for rugged 10"–12" wall touchscreens and gloved/wet fingers. Minimum tap targets are 48px to 52px.

---

## 2. Design Tokens & Color Palettes

### Dark Mode Semantic Mapping (Default)
| Token | Hex / Value | Purpose |
|---|---|---|
| `--background` | `#020617` (Slate 950) | Main viewport canvas |
| `--card` | `#0f172a` (Slate 900) | Ticket cards, dashboard tiles, modal backdrops |
| `--card-border` | `#1e293b` (Slate 800) | Subtle contrast boundaries |
| `--foreground` | `#f8fafc` (Slate 50) | Primary headers and high-contrast ticket titles |
| `--muted-foreground` | `#94a3b8` (Slate 400) | Timestamps, helper descriptions, table headers |
| `--emerald-live` | `#10b981` (Emerald 500) | Active connections, on-track SLA, accepted tasks |
| `--amber-warn` | `#f59e0b` (Amber 500) | Warning SLA (< 5 mins remaining), pending tasks |
| `--rose-breach` | `#f43f5e` (Rose 500) | Breached SLA, critical alerts, destructive actions |
| `--indigo-focus` | `#6366f1` (Indigo 500) | Tab underlines, platform analytics accents |

### Light Mode Semantic Mapping
| Token | Hex / Value | Purpose |
|---|---|---|
| `--background` | `#f8fafc` (Slate 50) | Main viewport canvas |
| `--card` | `#ffffff` (Pure White) | Elevates content above canvas |
| `--card-border` | `#e2e8f0` (Slate 200) | Crisp, subtle dividers |
| `--foreground` | `#0f172a` (Slate 900) | High readability under sunlight |
| `--muted-foreground` | `#64748b` (Slate 500) | Secondary metadata |

---

## 3. Typography Hierarchy
- **Primary Font**: `Inter`, system-ui, -apple-system, sans-serif
- **Monospace Font**: `JetBrains Mono`, `ui-monospace`, monospace (for Order IDs `#0421`, Trace IDs `tr_91b72e0a`, Timestamps, and Integer Paise)

| Level | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Display | 28px (1.75rem) | 700 Bold | 1.2 | -0.02em |
| Heading 1 | 22px (1.375rem) | 600 SemiBold | 1.25 | -0.015em |
| Heading 2 | 18px (1.125rem) | 600 SemiBold | 1.3 | -0.01em |
| Body Bold | 14px (0.875rem) | 600 SemiBold | 1.4 | 0 |
| Body Regular| 14px (0.875rem) | 400 Regular | 1.5 | 0 |
| Caption/Mono| 12px (0.75rem) | 500 Medium | 1.4 | +0.02em |

---

## 4. Spacing Scale & Touch Ergonomics
- **Base Grid**: 4px / 8px grid
- **Minimum Tap Target**: 48px $\times$ 48px (Primary buttons $\ge$ 52px on Kitchen KDS)
- **Ticket Width**: Minimum 320px fixed on horizontal KDS rail
- **Touch Active States**: `active:scale-[0.98]` feedback for instant physical feel

---

## 5. Motion, Feedback & Sound Protocols
- **Realtime Incoming Order**:
  - Web Audio synthesis: Dual-tone chime (D5: 587Hz $\rightarrow$ A5: 880Hz, 350ms duration)
  - Visual: Emerald outer border pulse `ring-2 ring-emerald-500` for 400ms
  - Card Entrance: Slide-down transition `150ms cubic-bezier(0.16, 1, 0.3, 1)`
- **SLA Breach Pulse**:
  - Soft amber pulse: `@keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`
  - High-visibility rose ping: Outer expanding halo for tasks overdue past threshold
- **Concurrency Collision Toast**:
  - Warning tone: Descending sawtooth frequency
  - Instant state rollback with informative toast: `"Task #0421 was accepted by Chef Marco 0.4s ago"`

---

## 6. The 8 Ops-Kit Components Specification
1. `DataTable`: Virtualized rows (TanStack Virtual), sticky headers, search/filter, permission 403 boundary handling.
2. `SlaBadge`: Dynamic status calculation with emerald/amber/rose color shifts and animated pulse effects.
3. `PremiumDialog`: Glassmorphic `backdrop-blur-sm bg-black/60` modal with focus trapping.
4. `KpiTile`: Dense metric card with gradient glow, loading skeleton, and delta trend pills.
5. `QueueListItem`: Interactive ticket item with optimistic mutation triggers and allergen badges.
6. `AnimatedSvgChart`: Zero-dependency SVG path curve and bar charts keeping bundle size under 150KB.
7. `TabNavigation`: Smooth underline indicator with notification counts.
8. `EmptyErrorState`: Branded zero-data, network offline, and cross-tenant access denied states.
