// components/guest/test-ids.ts
// The E2E test-ID contract for M3's Playwright suite (docs/m2/06 §7). Import the exact strings
// from here rather than retyping them. The current timeline step also carries data-status.

export const GUEST_TID = {
  appBar: 'guest-appbar',
  roomChip: 'guest-room-chip',
  themeToggle: 'guest-theme-toggle',

  qrLoading: 'guest-qr-loading',
  qrError: 'guest-qr-error',
  qrRetry: 'guest-qr-retry',

  home: 'guest-home',
  greeting: 'guest-home-greeting',
  activeStrip: 'guest-active-strip',
  quick: (k: string) => `guest-quick-${k}`,
  nav: (k: string) => `guest-nav-${k}`,

  menu: 'guest-menu',
  menuSearch: 'menu-search',
  vegToggle: 'menu-veg-toggle',
  menuCat: (slug: string) => `menu-cat-${slug}`,
  menuItem: (id: string) => `menu-item-${id}`,
  menuAdd: (id: string) => `menu-add-${id}`,
  menuQty: (id: string) => `menu-qty-${id}`,
  cartBar: 'cart-bar',
  itemSheet: 'item-sheet',
  itemAdd: 'item-add',

  cart: 'guest-cart',
  cartLine: (id: string) => `cart-line-${id}`,
  cartPlaceOrder: 'cart-place-order',
  cartEmpty: 'cart-empty',

  request: 'guest-request',
  requestCategory: (c: string) => `request-category-${c}`,
  requestPreset: (s: string) => `request-preset-${s}`,
  requestSubmit: 'request-submit',

  activity: 'guest-activity',

  orderTracking: 'guest-order-tracking',
  orderTimeline: 'order-status-timeline',
  orderCurrent: 'order-status-current',

  requestTracking: 'guest-request-tracking',
  requestTimeline: 'request-status-timeline',
  requestCurrent: 'request-status-current',

  bill: 'guest-bill',
  billTotal: 'bill-total',
  billPay: 'bill-pay',
  paymentConfirm: 'payment-confirm',

  receipt: 'guest-receipt',
  feedbackSubmit: 'feedback-submit',
  feedbackThanks: 'feedback-thanks',

  rejoin: 'rejoin-screen',
  offline: 'guest-offline',
  landing: 'landing',
  landingDemoQr: 'landing-demo-qr',
} as const;
