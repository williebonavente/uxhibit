import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DesignsGallery from "@/components/designs-gallery";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function getInitials(name: string | null) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) redirect("/auth/login"); 

  const userId = auth.user.id;

  // Fetch the profile row for this user only
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio")
    .eq("id", userId)
    .single();

  // Fallbacks from auth.user.user_metadata if row missing
  const fullName =
    profile?.full_name ||
    (auth.user.user_metadata.full_name as string | undefined) ||
    (auth.user.user_metadata.username as string | undefined) ||
    "User";

  const avatarUrl =
    profile?.avatar_url ||
    (auth.user.user_metadata.avatar_url as string | undefined) ||
    undefined;

  const bio =
    profile?.bio ||
    (auth.user.user_metadata.bio as string | undefined) ||
    "UI/UX Designer";

  // Optional: log (server) if profile not found
  if (!profile && !profileError) {
    console.warn("Profile row not found for user:", userId);
  }

  return (
    <div className="flex flex-col space-y-5">
      <div className="site-header grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center gap-4 sm:gap-6 px-2 sm:px-0">
        <div className="flex-1 min-w-0">
          <p className="hidden sm:block text-white text-sm sm:text-base">
            Welcome back,{" "}
            <span className="font-semibold">{fullName.split(" ")[0]}</span>!
          </p>
          <p className="hidden sm:block font-semibold text-white text-balance leading-tight text-[clamp(1.25rem,4vw,2rem)]">
            It&apos;s Time to{" "}
            <span className="xhibit-gradient-text">Xhibit</span> Greatness.
          </p>
        </div>
        <div className="user-card hidden sm:flex items-center gap-3 sm:gap-4 bg-white/5 rounded-xl p-2 sm:p-3 backdrop-blur supports-[backdrop-filter]:bg-white/10">
          <Avatar className="h-24 w-24 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-bl-full">
            <AvatarImage
              src={
                avatarUrl
                  ? avatarUrl.startsWith("http")
                    ? avatarUrl
                    : `/api/avatars?path=${encodeURIComponent(avatarUrl)}`
                  : undefined
              }
              alt={fullName}
            />
            <AvatarFallback className="rounded-lg text-black dark:text-white">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate max-w-[240px]">
              {fullName}
            </p>
            <p className="text-xs sm:text-sm text-black/80 truncate max-w-[240px]">
              {bio}
            </p>
          </div>
        </div>

        {/* Mobile */}
        <div className="user-card-mobile sm:hidden flex flex-col items-center gap-2">
          <Avatar className="h-19 w-19 rounded-bl-full">
            <AvatarImage
              src={
                avatarUrl
                  ? avatarUrl.startsWith("http")
                    ? avatarUrl
                    : `/api/avatars?path=${encodeURIComponent(avatarUrl)}`
                  : undefined
              }
              alt={fullName}
            />
            <AvatarFallback className="rounded-lg text-black dark:text-white">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-center">
            <p className="font-semibold text-base truncate">{fullName}</p>
            <p className="text-sm text-black/80 truncate">{bio}</p>
          </div>
        </div>
      </div>

      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">My Works</h1>
      </div>
      <DesignsGallery />
    </div>
  );
}
