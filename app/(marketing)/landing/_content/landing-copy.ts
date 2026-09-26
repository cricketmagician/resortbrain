// app/(marketing)/landing/_content/landing-copy.ts
// Every landing-page string, verbatim from docs/m2/08-copy-deck.md §3. No inline strings in the
// section components — import from here instead.

export const LANDING_COPY = {
  meta: {
    title: 'ResortBrain — Hospitality at the speed of a scan',
    description:
      "ResortBrain turns every room's QR code into a branded concierge: in-room dining, service requests, live status and digital receipts, with real-time staff workspaces behind it.",
  },
  header: {
    wordmark: 'ResortBrain',
    nav: [
      { href: '#product', label: 'Product' },
      { href: '#how', label: 'How it works' },
      { href: '#guests', label: 'For guests' },
      { href: '#teams', label: 'For teams' },
      { href: '#security', label: 'Security' },
    ],
    pricing: { href: '/pricing', label: 'Pricing' },
    cta: 'Try the live demo',
  },
  hero: {
    eyebrow: 'Hotel operations, reimagined',
    heading: 'Hospitality at the speed of a scan.',
    sub: 'Guests order, request and pay from the QR code in their room, with no app and no waiting. Your team gets the right task on the right device, with a clock on it.',
    ctaPrimary: 'Try the live demo',
    ctaSecondary: 'See how it works',
    proof: ['No app to install', 'Works on any phone', 'Designed to load in under 2 seconds'],
    phone: {
      newOrder: 'New order · Room 304',
      delivered: 'Delivered · 14 min',
    },
  },
  builtFor: {
    title: 'Built for',
    items: ['Resorts', 'Boutique hotels', 'Heritage properties', 'Serviced apartments'],
  },
  problem: {
    title: 'Every stay runs on a thousand small requests.',
    items: [
      {
        problem: 'Guests wait.',
        problemBody: 'Calls to reception ring out, and towels take an age.',
        answer: 'Two taps, live status.',
        answerBody: 'Guests see exactly where their order or request is, to the minute.',
      },
      {
        problem: 'Staff miss requests.',
        problemBody: 'Walkie-talkies, sticky notes and phones that ring out.',
        answer: 'The right task, on the right device.',
        answerBody: "A chime in the kitchen, a push to the housekeeper's phone, and a clear owner for every job.",
      },
      {
        problem: 'Managers are blind.',
        problemBody: "No one knows what's late until a guest complains.",
        answer: 'Nothing slips.',
        answerBody: 'Missed deadlines escalate automatically, and the dashboard shows it live.',
      },
    ],
  },
  howItWorks: {
    title: 'Three steps. No app store.',
    steps: [
      { number: '1', title: 'Scan.', body: "Every room has its own QR code, and the guest's camera is the app." },
      { number: '2', title: 'Order or ask.', body: 'A branded menu, one-tap requests, and notes for the kitchen.' },
      { number: '3', title: 'Watch it happen.', body: 'Placed, accepted, preparing, delivered, updated live.' },
    ],
  },
  forGuests: {
    title: 'A concierge in every pocket.',
    items: [
      { title: 'Branded menu', body: 'Your menu, your photos, your prices, rendered in about two seconds.' },
      { title: 'Live status', body: 'Every order and request, tracked to the minute.' },
      { title: 'One-tap requests', body: 'Towels, turndown, a taxi. Picked from a list, sent instantly.' },
      { title: 'Bill and receipt', body: 'See the bill, pay, and print or save a GST invoice.' },
      { title: 'Installable', body: 'Add to the home screen, no app store required.' },
      { title: 'Built for hotel Wi-Fi', body: 'Designed to load in under 2 seconds on 4G, with a menu that works offline.' },
    ],
  },
  forTeams: {
    title: 'Your team, perfectly in sync.',
    items: [
      { title: 'Kitchen display', body: 'New orders chime in real time. Accept, prepare, ready.' },
      { title: 'Push to any phone', body: 'Alerts arrive even when the app is closed.' },
      { title: 'Escalation built in', body: 'If a task sits past its deadline, the duty manager knows.' },
      { title: 'Manager dashboard', body: 'Response times, volumes and performance, live.' },
    ],
    cta: 'See plans',
  },
  security: {
    title: "Engineering you can't see.",
    items: [
      "Every hotel's data is isolated at the database layer, and that's tested on every change.",
      'Prices, taxes and totals are calculated on the server, never on the phone.',
      'Payments are idempotent, so a double tap never means a double charge.',
      'Every critical action is written to an audit trail.',
    ],
  },
  liveDemo: {
    title: 'Scan it. Right now.',
    body: "Point your phone's camera at the code. You'll be in Room 304 at Grand Azure Resort & Spa, so order something and watch it move.",
    steps: ['Open your camera', 'Scan the code', 'Order or request anything'],
    caption: 'Demo stay · test mode · no real orders or payments',
    subtitle: 'Grand Azure Resort & Spa · Room 304 (demo)',
    copyLink: 'Copy link',
  },
  roadmap: {
    title: "What's next.",
    badge: 'Roadmap',
    items: ['AI concierge', 'Inventory forecasting', 'OTA and PMS integrations', 'Payroll export'],
  },
  finalCta: {
    title: 'Bring ResortBrain to your property.',
    ctaPrimary: 'Try the live demo',
    ctaSecondary: 'See plans',
  },
  footer: {
    tagline: 'Hospitality at the speed of a scan.',
    builtBy: 'Built by',
    copyright: '© 2026 ResortBrain.',
  },
} as const;
