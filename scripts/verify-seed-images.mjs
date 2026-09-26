#!/usr/bin/env node
// scripts/verify-seed-images.mjs
// HEAD-checks every image_url, logo_url and banner_url in the guest seed and exits 1 on anything
// that isn't 200. images.unsplash.com is blocked in the implementation sandbox (docs/m2/07 §3),
// so run this on a machine or Vercel preview with open internet before adding new photo URLs.

import { tsImport } from 'tsx/esm/api';

const TIMEOUT_MS = 8000;

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal: controller.signal });
    }
    return { ok: res.status === 200, status: res.status };
  } catch (err) {
    return { ok: false, status: null, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const { GUEST_HOTELS_SEED, GUEST_MENU_SEED } = await tsImport('../db/seed/guest/guest_seed.ts', import.meta.url);

  const targets = [];
  for (const hotel of GUEST_HOTELS_SEED) {
    if (hotel.logo_url) targets.push({ label: `${hotel.slug} logo_url`, url: hotel.logo_url });
    if (hotel.banner_url) targets.push({ label: `${hotel.slug} banner_url`, url: hotel.banner_url });
  }
  for (const item of GUEST_MENU_SEED) {
    if (item.image_url) targets.push({ label: `${item.id} (${item.name}) image_url`, url: item.image_url });
  }

  console.log(`Checking ${targets.length} seed image URLs…\n`);

  let failures = 0;
  for (const target of targets) {
    const result = await checkUrl(target.url);
    console.log(`  ${result.ok ? 'OK  ' : 'FAIL'}  ${target.label} -> ${result.status ?? result.error}`);
    if (!result.ok) failures++;
  }

  console.log(`\n${targets.length - failures}/${targets.length} URLs returned 200.`);
  if (failures > 0) {
    console.error(`\n${failures} seed image URL(s) failed verification.`);
    process.exit(1);
  }
}

main();
