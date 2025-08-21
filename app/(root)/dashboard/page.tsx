import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DesignsGallery from "@/components/designs-gallery";

export function getInitials(name: string | null) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function Dashboard() {
  // TODO: feat: Add Pagination
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }


  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, bio")
    .eq("id", data.user.id)
    .single();


  return (
    <div className="flex flex-col space-y-5">
      <div className="site-header grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center gap-4 sm:gap-6 px-2 sm:px-0">
        <div className="flex-1 min-w-0">
          <p className="hidden sm:block text-white text-sm sm:text-base">
            Welcome back, <span className="font-semibold">{profile?.full_name?.split(" ")[0]}</span>!
          </p>
          <p className="hidden sm:block font-semibold text-white text-balance break-words leading-tight text-[clamp(1.25rem,4vw,2rem)]">
            It&apos;s Time to <span className="xhibit-gradient-text"> Xhibit</span> Greatness.
          </p>
        </div>
        {/* User Card */}
        <div
          className="user-card hidden sm:flex justify-self-stretch sm:justify-self-end items-center gap-3 sm:gap-4 bg-white/5 dark:bg-white/5 rounded-xl p-2 sm:p-3 backdrop-blur supports-[backdrop-filter]:bg-white/10"
        >
          <Avatar className="h-24 w-24 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-bl-full shrink-0">
            <AvatarImage
              src={
                profile?.avatar_url
                  ? (profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                  : undefined
              }
              alt={profile?.full_name ?? "User"}
            />
            <AvatarFallback className="rounded-lg text-black dark:text-white">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate max-w-[70vw] sm:max-w-[240px]">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs sm:text-sm text-black/80 truncate max-w-[70vw] sm:max-w-[240px]">
              {profile?.bio ?? "UI/UX Designer"}
            </p>
          </div>
        </div>
        {/* Avatar component for mobile header */}
        <div className="user-card-mobile sm:hidden flex flex-col items-center gap-2 justify-self-start w-fit">
          <Avatar className="h-19 w-19 rounded-bl-full shrink-0">
            <AvatarImage
              src={
                profile?.avatar_url
                  ? (profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                  : undefined
              }
              alt={profile?.full_name ?? "User"}
            />
            <AvatarFallback className="rounded-lg text-black dark:text-white">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{profile?.full_name || "User"}</p>
            <p className="text-sm text-black/80 truncate">{profile?.bio ?? "UI/UX Designer"}</p>
          </div>
        </div>
      </div>

      <div className="border-b-2 p-2">
        <h1 className="text-xl font-medium">My Works</h1>
      </div>
      <DesignsGallery />
    </div>
  );
}