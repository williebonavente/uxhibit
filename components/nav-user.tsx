"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/app/auth/login/action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getInitials } from "@/app/(root)/page";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { type User } from "@supabase/supabase-js";
import { Skeleton } from "./ui/skeleton";


export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar();

  const [loading, setLoading] = useState(true)
  const [fullname, setFullName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [age, setAge] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  // Add state for pending avatar 
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{
    id: string,
    username: string,
    fullname: string;
    avatar_url?: string;
    age: number | string;
    gender: string;
    bio: string;
  } | null>(null);



  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, username, full_name, website, avatar_url, age, gender, bio`)
        .eq('id', user?.id)
        .single()


      if (error && status !== 406 && Object.keys(error).length > 0) {
        console.log(error);
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          fullname: data.full_name,
          avatar_url: data.avatar_url,
          age: data.age,
          gender: data.gender,
          bio: data.bio,
        });
        setFullName(data.full_name);
      }
    } catch (error) {
      // if (error && typeof error === "object" && Object.keys(error).length > 0) {
      //   console.error(error);
      //   toast.error("Error loading user data.");
      // }
      console.log(error);
    } finally {
      setLoading(false);
    }

  }, [user])

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    getProfile()
  }, [user, getProfile])

  const handleAccountClick = async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user?.id) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, website, avatar_url, age, gender, bio")
        .eq("id", authData.user.id)
        .single();
      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          fullname: data.full_name,
          avatar_url: data.avatar_url,
          age: data.age,
          gender: data.gender,
          bio: data.bio,
        });
        setOpen(true);
      }
    }
  };

  const router = useRouter();
  async function handleLogOut() {
    const result = await logout();
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You have been logout.");
    router.push("/auth/login");
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center mt-8h-32 gap-4">
        {/* Avatar skeleton */}
        <Skeleton className="h-8 w-8 rounded-full" />
        {/* Profile info skeleton (name + email) */}
        <div className="grid flex-1 text-left text-sm leading-tight gap-2">
          <Skeleton className="h-4 w-24 rounded" /> {/* Name skeleton */}
          <Skeleton className="h-4 w-32 rounded" /> {/* Email skeleton */}
        </div>
      </div>
    );
  }
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.fullname} />
                  {/* Display the the initial if the user does not have avatar */}
                  <AvatarFallback className="rounded-lg grayscale">{getInitials(fullname)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* Getting the name from the database */}
                  <span className="truncate font-medium">{fullname}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {/* Getting the email from the database */}
                    <span className="truncate font-medium">{profile?.username ?? email ?? profile?.fullname}</span>
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              {/* TODO:  */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {/* TODO: To be implemented */}
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.fullname ?? email ?? "User"} />
                    <AvatarFallback className="rounded-lg">{getInitials(fullname)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{fullname}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      <span className="truncate font-medium">{email}</span>
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleAccountClick}>
                  <IconUserCircle />
                  {/* TODO: make the functional button here */}
                  Account
                </DropdownMenuItem>
                {/* removed billing */}
                <DropdownMenuItem>
                  <IconNotification />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogOut}> <IconLogout /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred, darkened background */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Centered form */}
          <div className="relative z-10 bg-white dark:bg-[#141414] rounded-xl shadow-lg p-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Account Information
            </h2>
            <p className="mb-6 text-center text-muted-foreground">
              View and update your personal information.
            </p>
            {profile && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const supabase = createClient();
                  let imageUrl = profile.avatar_url;
                  //  Only upload if a new avatar is selected
                  if (pendingAvatar) {
                    const { data, error: uploadError } = await supabase.storage
                      .from("avatars")
                      .upload(`${profile.id}-${pendingAvatar.name}`, pendingAvatar, {
                        cacheControl: "3600",
                        upsert: true,
                      });
                    if (uploadError) {
                      toast.error(uploadError.message);
                      return;
                    }
                    const { data: publicUrlData } = supabase.storage
                      .from("avatars")
                      .getPublicUrl(`${profile.id}-${pendingAvatar.name}`);
                    imageUrl = publicUrlData.publicUrl;
                  }

                  // Update profile in DB
                  const { error } = await supabase
                    .from("profiles")
                    .update({
                      username: profile.username,
                      full_name: profile.fullname,
                      age: profile.age,
                      avatar_url: imageUrl,
                      bio: profile.bio,
                    })
                    .eq("id", profile.id);

                  if (!error) {
                    toast.success("Profile Updated!");
                    setFullName(profile.fullname);
                    setAvatarUrl(imageUrl ?? null);
                    setOpen(false);
                    router.refresh();
                    getProfile();
                    setPendingAvatar(null);
                    setAvatarPreview(null);
                  } else {
                    toast.error("Failed to update profile");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label>Username</label>
                  <Input
                    value={profile.username ?? "User"}
                    onChange={e => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
                <div>
                  <label>Full Name</label>
                  <Input
                    value={profile.fullname}
                    onChange={e => setProfile({ ...profile, fullname: e.target.value })}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <Input
                    value={email ?? "Cannot fetch User email"}
                    disabled
                  />
                </div>
                <div>
                  <label>Age</label>
                  <Input
                    type="number"
                    min={10}
                    max={80}
                    value={profile.age === 0 ? "" : profile.age ?? ""}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setProfile({ ...profile, age: "" });
                        return;
                      }
                      const value = Number(raw);
                      // Only update if value is a valid number and in range
                      if (!isNaN(value) && value >= 10 && value <= 80) {
                        setProfile({ ...profile, age: value });
                      }
                    }}
                    placeholder="Enter your age (10-80)"
                  />
                </div>

                <div>
                  <label >Gender</label>
                  <Input
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  />
                </div>

                {/* UU Be careful */}
                <div>
                  <div className="flex flex-col items-center gap-2">
                    <label className="font-semibold mb-2">Avatar</label>
                    <div
                      className="relative cursor-pointer group"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <Avatar className="h-32 w-32 rounded-full border-4 border-gray-300 group-hover:border-blue-500 transition shadow-xl">
                        {/* <AvatarImage src={profile?.avatar_url} alt={profile?.fullname} /> */}
                        <AvatarImage src={avatarPreview ?? profile?.avatar_url} alt={profile?.fullname} />
                        <AvatarFallback className="rounded-full text-4xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {getInitials(profile?.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-full">
                        <span className="text-white text-lg font-semibold">Change</span>
                      </div>
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          // Adding preview
                          setPendingAvatar(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                  {/* Bio just to replace the UI/UX Designer message */}
                  <div>
                  <label>Bio</label>
                  <Input
                    value={profile.bio ?? "UI/UX  Designer"}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>
                </div>
                <footer className="flex justify-center gap-4 mt-16">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                  >
                    Save Changes
                  </Button>
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}