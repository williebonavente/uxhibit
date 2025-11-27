import { createClient } from '@/utils/supabase/server'
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
  const error_code = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('OAuth code from query:', code);
  console.log('Error from query:', error_code, error_description);

  // Handle OAuth errors
  if (error_code) {
    console.error('OAuth error:', error_code, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error_code)}`, requestUrl.origin)
    );
  }

  if (!code) {
    console.error('No code found in callback');
    return NextResponse.redirect(
      new URL('/login?error=no_code', requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();
    console.log('Supabase client created');

    console.log('Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    // console.log('Exchange result:', { error, data });

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Extract Figma access token from the session
    const figmaAccessToken = data.session?.provider_token;
    const figmaRefreshToken = data.session?.provider_refresh_token;
    
    console.log('Figma access token obtained:', !!figmaAccessToken);

    const { data: { user } } = await supabase.auth.getUser();
    console.log('User retrieved:', user?.id);
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, first_name, middle_name, last_name")
        .eq("id", user.id)
        .single();
    
      if (!profile || !profile.username) {
        // Get the full name from user metadata
        const fullname =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.name_full ||
          "";
    
        // Split fullname into first, middle, last name
        const [first_name = "", middle_name = "", ...rest] = fullname.split(" ");
        const last_name = rest.length ? rest.join(" ") : middle_name;
        const middle = rest.length ? middle_name : "";
    
        const username = generaterUsername(fullname);
    
        console.log('Creating profile for user:', user.id);
        // Upsert the profile with the generated username and split names
        const { error: profileError } = await supabase.from("profiles").upsert([
          {
            id: user.id,
            username,
            first_name,
            middle_name: middle,
            last_name,
          }
        ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }
    
      // Ensure profile_details exists for this user and store Figma tokens
      const { data: details } = await supabase
        .from("profile_details")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
    
      if (!details) {
        console.log('Creating profile_details for user:', user.id);
        const { error: detailsError } = await supabase.from("profile_details").insert([
          { 
            profile_id: user.id,
            figma_access_token: figmaAccessToken,
            figma_refresh_token: figmaRefreshToken
          }
        ]);

        if (detailsError) {
          console.error('Profile details creation error:', detailsError);
        }
      } else {
        // Update existing profile_details with Figma tokens
        console.log('Updating profile_details with Figma tokens for user:', user.id);
        const { error: updateError } = await supabase
          .from("profile_details")
          .update({
            figma_access_token: figmaAccessToken,
            figma_refresh_token: figmaRefreshToken
          })
          .eq("profile_id", user.id);

        if (updateError) {
          console.error('Profile details update error:', updateError);
        }
      }
    }

    console.log('Redirecting to /auth/processing');
    return NextResponse.redirect(new URL('/auth/processing', requestUrl.origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
    );
  }
}