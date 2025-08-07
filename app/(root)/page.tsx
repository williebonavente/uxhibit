import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export function getInitials(name: string | null) {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
export default async function Dashboard() {

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
      <div className="site-header">
        <div>
          <p className="text-white">Welcome back, <span className="font-semibold">
           {profile?.full_name?.split(" ")[0]} 
          </span>!
          </p>
          <p className="text-4xl text-white">
            It&apos;s Time to
            <span className="xhibit-gradient-text"> Xhibit</span> Greatness.
          </p>
        </div>
        <div className="user-card">
          <div>
            <Avatar className="h-14 w-14 rounded-lg">
              {profile?.avatar_url? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              ) : null}
              <AvatarFallback className="rounded-lg text-black dark:text-white">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold">
              {profile?.full_name|| "User"}
            </p>
            {/* Make this A BIO Data fetching */}
            <p className="text-sm">{profile?.bio ?? "UI/UX Designer"}</p>
          </div>
        </div>
      </div>
      <div className="border-b-2 p-2">
        <h1 className="text-xl font-medium">My Works</h1>
        {/* TODO: Add new component to display the uploaded UI/UX design */}
      </div>
    </div>
  );
}