import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "../types/user";

export async function fetchCurrentUserProfile(): Promise<{ userId: string | null; profile: UserProfile }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return { userId: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, middle_name, last_name, avatar_url")
      .eq("id", userId)
      .single();

    const fullName =
      [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown";

    return {
      userId,
      profile: { fullName, avatarUrl: profile?.avatar_url ?? null },
    };
  } catch (err) {
    console.error("[fetchCurrentUserProfile] error", err);
    return { userId: null, profile: null };
  }
}

/**
 * Factory that returns a handler which loads user data and sets the provided setters.
 */
export function createFetchUserProfileHandler(options: {
  setCurrentUserId: (id: string | null) => void;
  setCurrentUserProfile: (p: UserProfile) => void;
}) {
  const { setCurrentUserId, setCurrentUserProfile } = options;

  return async function fetchAndSetUserProfile() {
    const { userId, profile } = await fetchCurrentUserProfile();
    setCurrentUserId(userId);
    setCurrentUserProfile(profile);
  };
}