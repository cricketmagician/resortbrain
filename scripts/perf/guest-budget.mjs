#!/usr/bin/env node
// scripts/perf/guest-budget.mjs — docs/m2/06 §4 (Performance Captain).
// Run after `npm run build && npm start`. Opens a throttled mobile Chromium context per route,
// sums encoded (gzip/br) JS bytes and the largest image response over CDP, and reads LCP/CLS
// through a buffered PerformanceObserver once the page has settled. Exits 1 on any budget breach.

import { chromium } from 'playwright-core';

const BASE_URL = process.env.PERF_BASE_URL ?? 'http://localhost:3000';
const CHROME_PATH = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium';
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

// Chrome DevTools' "Fast 3G" numbers, converted from Mbps/Kbps to bytes/sec as the CDP expects.
const NETWORK_CONDITIONS = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1000 * 1000) / 8,
  uploadThroughput: (750 * 1000) / 8,
};

const ROUTES = [
  { path: '/', kind: 'landing' },
  { path: '/h/grand-azure', kind: 'guest' },
  { path: '/h/grand-azure/menu', kind: 'guest' },
  { path: '/h/heritage-palace/menu', kind: 'guest' },
];

// Hard ceilings (docs/m2/06 §4). Landing has no hero image, so its image budget is unchecked.
const BUDGETS = {
  landing: { lcpMs: 1800, cls: 0.02, jsBytes: 140 * 1024, imageBytes: null },
  guest: { lcpMs: 2000, cls: 0.05, jsBytes: 180 * 1024, imageBytes: 120 * 1024 },
};

async function measureRoute(browser, route) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: MOBILE_UA,
  });

  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const resourceTypeByRequestId = new Map();
    let jsBytes = 0;
    let largestImageBytes = 0;

    cdp.on('Network.responseReceived', (event) => {
      resourceTypeByRequestId.set(event.requestId, event.type);
    });
    cdp.on('Network.loadingFinished', (event) => {
      const type = resourceTypeByRequestId.get(event.requestId);
      if (type === 'Script') jsBytes += event.encodedDataLength;
      if (type === 'Image') largestImageBytes = Math.max(largestImageBytes, event.encodedDataLength);
    });

    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(1000);

    const { lcp, cls } = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let lcpValue = 0;
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) lcpValue = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) clsValue += entry.value;
            }
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve({ lcp: lcpValue, cls: clsValue }), 150);
        })
    );

    return { lcp, cls, jsBytes, largestImageBytes };
  } finally {
    await context.close();
  }
}

function checkBudget(kind, result) {
  const budget = BUDGETS[kind];
  const failures = [];
  if (result.lcp > budget.lcpMs) failures.push(`LCP ${result.lcp.toFixed(0)}ms > ${budget.lcpMs}ms`);
  if (result.cls > budget.cls) failures.push(`CLS ${result.cls.toFixed(3)} > ${budget.cls}`);
  if (result.jsBytes > budget.jsBytes) failures.push(`JS ${(result.jsBytes / 1024).toFixed(1)}KB > ${(budget.jsBytes / 1024).toFixed(0)}KB`);
  if (budget.imageBytes !== null && result.largestImageBytes > budget.imageBytes) {
    failures.push(`Image ${(result.largestImageBytes / 1024).toFixed(1)}KB > ${(budget.imageBytes / 1024).toFixed(0)}KB`);
  }
  return failures;
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const rows = [];
  let anyFailed = false;

  try {
    for (const route of ROUTES) {
      let result;
      let failures;
      try {
        result = await measureRoute(browser, route);
        failures = checkBudget(route.kind, result);
      } catch (error) {
        failures = [error instanceof Error ? error.message : String(error)];
        result = { lcp: NaN, cls: NaN, jsBytes: NaN, largestImageBytes: NaN };
      }
      if (failures.length > 0) anyFailed = true;
      rows.push({
        Route: route.path,
        'LCP (ms)': Number.isFinite(result.lcp) ? result.lcp.toFixed(0) : 'n/a',
        CLS: Number.isFinite(result.cls) ? result.cls.toFixed(3) : 'n/a',
        'JS (KB)': Number.isFinite(result.jsBytes) ? (result.jsBytes / 1024).toFixed(1) : 'n/a',
        'Largest image (KB)': Number.isFinite(result.largestImageBytes) ? (result.largestImageBytes / 1024).toFixed(1) : 'n/a',
        Status: failures.length === 0 ? 'PASS' : `FAIL: ${failures.join('; ')}`,
      });
    }
  } finally {
    await browser.close();
  }

  console.table(rows);
  if (anyFailed) {
    console.error('\nPerformance budget exceeded — see FAIL rows above.');
    process.exitCode = 1;
  } else {
    console.log('\nAll routes within budget.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
