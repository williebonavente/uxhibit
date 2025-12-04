import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function generateUsername(fullname: string) {
  if (!fullname) return "";
  return fullname.split(" ").join("").toLowerCase();
}

export async function GET(request: NextRequest) {
  console.log("--- Google OAuth Callback Start ---");
  const url = new URL(request.url);
  console.log("Request URL:", request.url);

  const code = url.searchParams.get("code");
  const errorCode = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  console.log("OAuth code from query:", code);
  console.log("Error from query:", errorCode, errorDescription);

  if (errorCode) {
    console.error("OAuth error:", errorCode, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || errorCode)}`, url.origin)
    );
  }

  if (!code) {
    console.error("No code found in callback");
    return NextResponse.redirect(new URL("/login?error=no_code", url.origin));
  }

  try {
    const supabase = await createClient();
    console.log("Supabase client created");

    console.log("Attempting to exchange code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)
      );
    }

    const googleAccessToken = data.session?.provider_token;
    const googleRefreshToken = data.session?.provider_refresh_token;
    console.log("Google provider token obtained:", !!googleAccessToken);

    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp.user;
    console.log("User retrieved:", user?.id);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, first_name, middle_name, last_name")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.username) {
        const fullname =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.name_full ||
          "";

        const [first_name = "", middle_name = "", ...rest] = fullname.split(" ");
        const last_name = rest.length ? rest.join(" ") : middle_name;
        const middle = rest.length ? middle_name : "";
        const username = generateUsername(fullname || user.email || user.id);

        console.log("Creating profile for user:", user.id);
        const { error: profileError } = await supabase.from("profiles").upsert([
          {
            id: user.id,
            username,
            first_name,
            middle_name: middle,
            last_name,
          },
        ]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      const { data: details } = await supabase
        .from("profile_details")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!details) {
        console.log("Creating profile_details for user:", user.id);
        const { error: detailsError } = await supabase.from("profile_details").insert([
          {
            profile_id: user.id,
            google_access_token: googleAccessToken,
            google_refresh_token: googleRefreshToken,
          },
        ]);
        if (detailsError) {
          console.error("Profile details creation error:", detailsError);
        }
      } else {
        console.log("Updating profile_details with Google tokens for user:", user.id);
        const { error: updateError } = await supabase
          .from("profile_details")
          .update({
            google_access_token: googleAccessToken,
            google_refresh_token: googleRefreshToken,
          })
          .eq("profile_id", user.id);
        if (updateError) {
          console.error("Profile details update error:", updateError);
        }
      }
    }

    console.log("Redirecting to /auth/processing");
    return NextResponse.redirect(new URL("/auth/processing", url.origin));
  } catch (e) {
    console.error("Google auth callback error:", e);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Authentication failed")}`, url.origin)
    );
  }
}