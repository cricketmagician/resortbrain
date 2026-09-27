// server/supabase.ts
// Server-only Supabase client for administrative and privileged operations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://afeudwengrjhziiuircm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Nearly every API route that talks to Supabase does so as a "try it, fall back to the
// local in-memory store on failure" best-effort attempt (see the try/catch blocks across
// app/api/**). Bounds each individual HTTP attempt — but the supabase-js client retries a
// failed request several times on its own before surfacing an error, so this alone doesn't
// bound the *total* wait (measured ~7s for 4 retries against an unreachable project even
// with a 5s per-attempt cap). withSupabaseTimeout() below is what actually bounds the total.
const SUPABASE_FETCH_TIMEOUT_MS = 2000;

function timeoutFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS) });
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: timeoutFetch,
  },
});

// Caps the *total* time (including the client's own internal retries) spent on a
// best-effort Supabase call before its caller falls back to local data. Resolves to
// `undefined` on timeout rather than rejecting, so callers can treat it the same as "no
// data" without an extra try/catch.
export async function withSupabaseTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T | undefined> {
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms));
  return Promise.race([promise, timeout]);
}
