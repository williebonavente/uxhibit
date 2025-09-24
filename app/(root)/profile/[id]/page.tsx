import { createClient } from "@/utils/supabase/client";
import CurrentUserLogger from "@/components/profile_management/current-user-logger";
import ProfileDesigns from "@/components/profile_management/profile-designs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage(props: { params: Promise<{ userId: string }> }) {
  const { params } = props;
  const { userId } = await params;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, bio")
    .eq("id", userId)
    .single();

  if (!profile) return <div>Profile not found.</div>;

  const fullName = profile.full_name;
  const avatarUrl = profile.avatar_url;
  const bio = profile.bio;

  return (
    <>
      <CurrentUserLogger />

      {/* Main Content Container - full width, dashboard style */}
      <div className="w-full flex flex-col px-4 md:px-8">
        {/* Profile Header */}
        <div className="site-header grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start sm:items-center gap-4 sm:gap-6 w-full mt-8 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm sm:text-base">
              Welcome to{" "}
              <span className="font-semibold">{fullName.split(" ")[0]}</span>&apos;s profile!
            </p>
            <p className="font-semibold text-white text-balance leading-tight text-[clamp(1.25rem,4vw,2rem)]">
              It&apos;s Time to{" "}
              <span className="xhibit-gradient-text">Xhibit</span> Greatness.
            </p>
          </div>
          <div className="user-card flex items-center gap-3 sm:gap-4 bg-white/5 rounded-xl p-2 sm:p-3 backdrop-blur supports-[backdrop-filter]:bg-white/10">
            <Avatar className="h-24 w-24 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-bl-full shrink-0">
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
                {/* Optionally initials or icon */}
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
        </div>

        {/* Section Title */}
        <div className="border-b-2 p-2 w-full mb-4">
          <h2 className="text-xl font-medium">{fullName.split(" ")[0]}&apos;s work</h2>
        </div>

        {/* Designs Gallery */}
        <div className="w-full">
          <ProfileDesigns profileUserId={userId} />
        </div>
      </div>
    </>
  );
}