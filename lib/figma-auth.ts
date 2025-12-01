import { createClient } from "@/utils/supabase/client";

export async function getFigmaAuthUrl() {
  try {
    const supabase = createClient();

    console.log("Starting Figma OAuth flow");

    // Add a 5-second delay before redirecting (optional, for UX)
    await new Promise((res) => setTimeout(res, 2000));

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "figma",
      options: {
        redirectTo: `${window.location.origin}/api/figma/auth/callback`,
        queryParams: {
          scope: [
            "current_user:read",
            "file_content:read",
            "file_metadata:read",
            "file_versions:read",
            "webhooks:read",
            "webhooks:write",
          ].join(" "),
        },
      },
    });

    if (error) {
      console.error("Supabase OAuth error:", error);
      throw error;
    }

    return data?.url;
  } catch (error) {
    console.error("Failed to initialize Figma auth:", error);
    throw error;
  }
}
