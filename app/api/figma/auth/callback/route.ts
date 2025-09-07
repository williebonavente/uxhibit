import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('--- Figma OAuth Callback Start ---');
  const requestUrl = new URL(request.url);
  console.log('Request URL:', request.url);

  const code = requestUrl.searchParams.get('code');
  console.log('OAuth code from query:', code);

  try {
    const supabase = await createClient();
    console.log('Supabase client created:', !!supabase);

    if (code) {
      console.log('Attempting to exchange code for session...');
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      console.log('Exchange result:', { error, data });

      if (error) {
        console.error('Error exchanging code for session:', error);
        throw error;
      }
      console.log('Code exchange successful.');
    } else {
      console.warn('No code found in query parameters.');
    }

    return NextResponse.redirect(new URL('/auth/processing', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    console.log('Redirecting to /dashboard due to error');
  } finally {
    console.log('--- Figma OAuth Callback End ---');
  }
}