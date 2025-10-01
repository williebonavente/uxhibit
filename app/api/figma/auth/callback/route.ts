import { createClient } from '@/utils/supabase/server'
// import { User } from 'lucide-react';
import { NextRequest, NextResponse } from 'next/server'


function generaterUsername(fullname: string) {
  if (!fullname) return "";
  return fullname.split(" ").join("").toLowerCase();
}
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

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // try to get the profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .eq("id", user.id)
        .single();

      // If profile does not exist ur username is empty, create/set it
      if (!profile || !profile.username) {
        // Get the full name from user metadata 
        // (Figma returns it as "user_metadata.name" 
        // or  "user_metadata.full_name" )
        const fullname =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.name_full ||
          "";

        const username = generaterUsername(fullname);
        // Upsert the profile with the generated username
        await supabase.from("profiles").upsert([
          {
            id: user.id,
            username,
            full_name: fullname,
          }
        ]);
      }
      // Ensure profile_details exits for this user
      const { data: details } = await supabase
        .from("profile_details")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!details) {
        await supabase.from("profile_details").insert([
          { profile_id: user.id }
        ]);
        
      }
    }


    return NextResponse.redirect(new URL('/auth/processing', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    console.log('Redirecting to /dashboard due to error');
  } finally {
    console.log('--- Figma OAuth Callback End ---');
  }
}