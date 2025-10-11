import { createClient } from '@/utils/supabase/server'
// import { User } from 'lucide-react';
import { NextRequest, NextResponse } from 'next/server'


function generaterUsername(fullname: string) {
  if (!fullname) return "";
  return fullname.split(" ").join("").toLowerCase();
}
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');

  try {
    const supabase = await createClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        throw error;
      }
    } else {
      console.warn('No code found in query parameters.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
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
    
        // Upsert the profile with the generated username and split names
        await supabase.from("profiles").upsert([
          {
            id: user.id,
            username,
            first_name,
            middle_name: middle,
            last_name,
          }
        ]);
      }
    
      // Ensure profile_details exists for this user
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
  } finally {
  }
}