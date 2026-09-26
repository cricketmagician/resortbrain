// public/sw.js — hand-written, no Workbox (docs/m2/06 §2).
// Bump VERSION on every change to this file so old caches get cleaned up on activate.
const VERSION = 'rb-sw-v1';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const IMAGES = `${VERSION}-images`;
const DATA = `${VERSION}-data`;
const PRECACHE = ['/offline', '/icon.svg', '/icons/192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstNavigation(request, url) {
  const cache = await caches.open(PAGES);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('sw-timeout')), 3000)),
    ]);
    if (response && response.ok) {
      cache.put(request, response.clone());
      trimCache(PAGES, 30);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // A never-visited page has no cached copy of its own, so /offline's HTML would otherwise be
    // served under this URL and fail to hydrate (Next's client router expects the URL and the
    // embedded route data to match). Redirecting makes the browser actually navigate there.
    if (url.pathname === '/offline') {
      const offline = await caches.match('/offline');
      if (offline) return offline;
    }
    return Response.redirect('/offline', 302);
  }
}

function isRscRequest(request, url) {
  return request.headers.get('RSC') === '1' || url.searchParams.has('_rsc');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache: guest/staff data endpoints, the QR resolve route, RSC payloads, everything else
  // not explicitly matched below (staff/admin routes included) — left untouched, no respondWith.
  if (
    url.pathname.startsWith('/api/orders') ||
    url.pathname.startsWith('/api/requests') ||
    url.pathname.startsWith('/api/billing') ||
    url.pathname.startsWith('/api/stays/') ||
    url.pathname.startsWith('/api/health') ||
    url.pathname.startsWith('/api/notifications') ||
    url.pathname.startsWith('/q/') ||
    isRscRequest(request, url)
  ) {
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (url.pathname.startsWith('/_next/image') || url.hostname === 'images.unsplash.com') {
    event.respondWith(staleWhileRevalidate(request, IMAGES, 80));
    return;
  }

  if (url.pathname.startsWith('/api/menu')) {
    event.respondWith(staleWhileRevalidate(request, DATA, 50));
    return;
  }

  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/offline' || url.pathname.startsWith('/h/'))) {
    event.respondWith(networkFirstNavigation(request, url));
    return;
  }

  // Everything else: untouched.
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// M3 owns push. Keep this block at the very end.
try {
  importScripts('/sw-push.js');
} catch {
  // push handler not deployed yet
}
