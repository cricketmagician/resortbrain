// app/auth/callback/route.ts
// Handles OAuth PKCE code exchange from Supabase Auth provider redirect
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  if (error) {
    console.error('Supabase OAuth callback error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Failed to exchange code for session:', err);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
