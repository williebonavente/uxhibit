import { createClient } from "@/utils/supabase/client";

export async function getGoogleAuthUrl() {
  try {
    const supabase = createClient();

    console.log("Starting Google OAuth flow");

    await new Promise((res) => setTimeout(res, 2000));

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/google/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase OAuth error:", error);
      throw error;
    }

    return data?.url;
  } catch (error) {
    console.error("Failed to initialize Google auth:", error);
    throw error;
  }
}
