"use client";

import {
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
import { getInitials } from "@/app/(root)/dashboard/page";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { type User } from "@supabase/supabase-js";
import { Skeleton } from "./ui/skeleton";
import { Bug, Settings, UserRound } from "lucide-react";


export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar();

  const [loading, setLoading] = useState(true)
  const [fullname, setFullName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  // const [username, setUsername] = useState<string | null>(null)
  // const [website, setWebsite] = useState<string | null>(null)
  // const [age, setAge] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  function generateUsername(fullname: string) {
    if (!fullname) return "";
    return fullname
      .split(" ")
      .join("")
      .toLowerCase();
  }
  const router = useRouter();
  async function handleLogOut() {
    const result = await logout();
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You have been logout.");
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
                <Avatar className="h-8 w-8 rounded-bl-full ">
                  {/* <AvatarImage src={profile?.avatar_url} alt={profile?.fullname} /> */}
                  <AvatarImage
                    src={
                      avatarPreview
                      ?? (profile?.avatar_url
                        ? (profile.avatar_url.startsWith("http")
                          ? profile.avatar_url
                          : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                        : undefined)
                    }
                    alt={profile?.fullname}
                  />
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
                  <Avatar className="h-8 w-8 rounded-bl-full">

                    {/* <AvatarImage 
                      src={profile?.avatar_url ?? undefined} alt={profile?.fullname ?? email ?? "User"} /> */}
                    <AvatarImage
                      src={
                        avatarPreview
                        ?? (profile?.avatar_url
                          ? (profile.avatar_url.startsWith("http")
                            ? profile.avatar_url
                            : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                          : undefined)
                      }
                      alt={profile?.fullname}
                    />
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
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {/* TODO: Insert the function Notifications somewhere down the road */}
                  <IconNotification />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bug />
                  Report a Bug
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserRound />
                  About Us
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogOut}> <IconLogout /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Blurred, darkened background */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Centered form */}
          <div
            className="relative z-[102] bg-white dark:bg-[#141414] rounded-xl shadow-lg 
                      w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-xl xl:max-w-[530px] mx-auto
                      p-3 sm:p-8 overflow-y-auto max-h-[90vh]"
          >
            {/* Adjusted font size and margin for mobile */}
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
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
                  // if (pendingAvatar) {
                  //   const { data, error: uploadError } = await supabase.storage
                  //     .from("avatars")
                  //     .upload(`${profile.id}-${pendingAvatar.name}`, pendingAvatar, {
                  //       cacheControl: "3600",
                  //       upsert: true,
                  //     });
                  //   if (uploadError) {
                  //     toast.error(uploadError.message);
                  //     return;
                  //   }
                  //   imageUrl = `${profile.id}-${pendingAvatar}`
                  //   const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                  //     .from("avatars")
                  //     // TODO: 
                  //       .createSignedUrl(`${profile.id}-${pendingAvatar.name}`, 6000 * 6000); // URL valid for 1 hour

                  //   if (signedUrlError) {
                  //     toast.error(signedUrlError.message);
                  //     return;
                  //   }
                  //   imageUrl = signedUrlData?.signedUrl;
                  // }

                  if (pendingAvatar) {
                    const filePath = `${profile.id}/${Date.now()}-${pendingAvatar.name}`;
                    const { error: uploadError } = await supabase.storage
                      .from("avatars")
                      .upload(filePath, pendingAvatar, {
                        cacheControl: "31536000",
                        upsert: true,
                      });
                    if (uploadError) {
                      toast.error(uploadError.message);
                      return;
                    }
                    imageUrl = filePath;
                  }

                  let username = profile.username;
                  if (!username && profile.fullname) {
                    username = generateUsername(profile.fullname);
                  }
                  // Update profile in DB
                  const { error } = await supabase
                    .from("profiles")
                    .update({
                      username,
                      full_name: profile.fullname,
                      age: profile.age,
                      avatar_url: imageUrl,
                      bio: profile.bio,
                      gender: profile.gender,
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
                  <div>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="relative cursor-pointer group"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-gray-300 group-hover:border-blue-500 transition shadow-xl">
                          {/* <AvatarImage src={avatarPreview ?? profile?.avatar_url} alt={profile?.fullname} /> */}
                          <AvatarImage
                            src={
                              avatarPreview
                              ?? (profile?.avatar_url
                                ? (profile.avatar_url.startsWith("http")
                                  ? profile.avatar_url
                                  : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                                : undefined)
                            }
                            alt={profile?.fullname ?? email ?? "User"}
                          />
                          <AvatarFallback className="rounded-full text-3xl sm:text-4xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
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
                        className="mb-4"
                      />
                    </div>
                  </div>
                  <label>Username</label>
                  <Input
                    value={profile.username ?? generateUsername(profile.fullname)}
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
                <div className="cursor-not-allowed">
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
                    value={profile?.age || ''}
                    onChange={e => {
                      const raw = e.target.value;

                      // Allow empty input
                      if (raw === '') {
                        setProfile(prev => prev ? { ...prev, age: '' } : prev);
                        return;
                      }

                      // Store the raw input first to allow typing
                      const tempValue = parseInt(raw, 10);
                      if (!isNaN(tempValue)) {
                        // Only show error for 3+ digits but still allow typing
                        if (raw.length > 3) {
                          toast.error("Invalid age. Please enter a number between 10-80.");
                        }
                        // Update state with the current input
                        setProfile(prev => prev ? { ...prev, age: tempValue } : prev);
                      }
                    }}
                    // Validate on blur instead
                    onBlur={e => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        if (value > 80 || value < 10) {
                          toast.error("Age must be between 10-80 years");
                          setProfile(prev => prev ? { ...prev, age: '' } : prev);
                        }
                      }
                    }}
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label >Gender</label>
                  <Input
                    value={profile?.gender?.trim() || ""}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    placeholder="Specify your gender"
                  />
                </div>

                {/* Footer buttons are now responsive: stack on mobile, row on desktop */}
                <footer className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-12">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="cursor-pointer w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer w-full sm:w-auto bg-[#ED5E20] text-[#FFF] hover:bg-[#d44e0f] dark:bg-[#d44e0f] dark:text-[#FFF] dark:hover:bg-[#ED5E20]"
                  >
                    Save Changes
                  </Button>
                </footer>
              </form>
            )}
          </div>
        </div >
      )
      }
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#141414] rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Delete Account</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                    // Call your API route to delete the user
                    const res = await fetch("/api/delete_user", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ userId: user?.id }),
                    });
                    if (res.ok) {
                      toast.success("Account deleted.");
                      router.push("/auth/login");
                    } else {
                      toast.error("Failed to delete account.");
                    }
                  } catch (err) {
                    toast.error("Failed to delete account.");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}