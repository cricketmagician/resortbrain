// lib/supabase.ts
// Supabase Client for client-side and server-side universal queries
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://afeudwengrjhziiuircm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Triggers Google OAuth sign-in flow via Supabase Auth
 */
export async function signInWithGoogle(redirectTo?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const targetRedirect = redirectTo || `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: targetRedirect,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs out current user session
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
