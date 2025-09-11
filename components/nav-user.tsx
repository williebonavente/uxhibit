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
import { useDesignNotifications } from "../lib/notification"
import { IconBell, IconX } from "@tabler/icons-react";


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
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState<string | null>(null);
  const [notifPage, setNotifPage] = useState(1);

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

  const notifPerpage = 5;

  const paginatedNotifcations = notifications.slice(
    (notifPage - 1) * notifPage,
    notifPage * notifPage
  );
  const totalPages = Math.ceil(notifications.length / notifPerpage);
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  // TODO: BE DELTED
  const heartNotification = useDesignNotifications(user?.id ?? null);
  const hasHeartNotifications = heartNotification.length > 0;

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

  const getNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: notifications } = await supabase
      .from("notifications")
      .select(`
      *,
      designs(title),
      from_user:profiles!notifications_from_user_id_fkey(full_name)
    `)
      .eq("to_user_id", user?.id)
      .order("created_at", { ascending: false });
    setNotifications(notifications ?? []);
  }, [user?.id]);

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
  const handleDeleteNotification = async (notifId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notifId);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success("Notification deleted.");
    } else {
      toast.error("Failed to delete notification.");
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

  useEffect(() => {
    if (user?.id) {
      getNotifications();
    }
  }, [user?.id, getNotifications]);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `to_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notif = payload.new;
          // Fetch sender name and design title
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", notif.from_user_id)
            .single();
          const { data: design } = await supabase
            .from("designs")
            .select("title")
            .eq("id", notif.design_id)
            .single();
          toast(
            <span className="flex items-center gap-2">
              <IconBell className="text-yellow-500" size={20} />
              <span>{sender?.full_name ?? "Someone"} loved your design!</span>
            </span>,
            {
              description: design?.title
                ? `Design: ${design.title}`
                : undefined,
              position: "top-center",
              duration: 5000,
            }
          );
          getNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, getNotifications]);

  useEffect(() => {
    setNotifPage(1);
  }, [showNotifModal, notifications.length]);

  // useEffect(() => {
  //   if (showNotifModal && notifications.some(n => !n.read)) {
  //     const supabase = createClient();
  //     // Mark all as read in the DB
  //     supabase
  //       .from("notifications")
  //       .update({ read: true })
  //       .eq("to_user_id", user?.id)
  //       .eq("read", false)
  //       .then(() => {
  //         // Update local state
  //         setNotifications((prev) =>
  //           prev.map((n) => ({ ...n, read: true }))
  //         );
  //       });
  //   }
  // }, [showNotifModal, notifications, user?.id]);
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
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotifModal(true)}>
                  <IconNotification />
                  Notifications
                  {notifications.some(n => !n.read) && (
                    <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
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
                    toast.error(`Failed to delete account.`, err);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNotifModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNotifModal(false)}
          />

          <div className="relative z-[301] bg-white dark:bg-[#141414] rounded-xl shadow-lg p-6 max-w-md w-full">
            <button
              onClick={() => setShowNotifModal(false)}
              className="absolute top-3 right-3 text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-white text-xl font-bold focus:outline-none"
              aria-label="Close"
              type="button"
            >
              <IconX />
            </button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <IconNotification /> Notifications
            </h3>
            {notifications.length === 0 ? (
              <div className="text-muted-foreground text-sm">No new notifications.</div>
            ) : (
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {/* Mark all as read button */}
                {unreadNotifications.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase
                          .from("notifications")
                          .update({ read: true })
                          .eq("to_user_id", user?.id)
                          .eq("read", false);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                      }}
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
                {unreadNotifications.length === 0 && notifications.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase
                          .from("notifications")
                          .update({ read: false })
                          .eq("to_user_id", user?.id)
                          .eq("read", true);
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: false }))
                        );
                      }}
                    >
                      Mark all as unread
                    </Button>
                  </div>
                )}


                {/* Unread notifications */}
                {unreadNotifications.length > 0 && (
                  <>
                    <li className="text-xs text-orange-600 font-semibold uppercase tracking-wide px-2 py-1">
                      Unread
                    </li>
                    {unreadNotifications.map((notif) => (
                      <li
                        key={notif.id}
                        className="flex items-center gap-2 text-sm group rounded px-2 py-1 bg-orange-50 
                        dark:bg-orange-900/30 font-semibold cursor-pointer"
                        onClick={async () => {
                          if (notifLoading === notif.id) return;
                          setNotifLoading(notif.id);

                          if (!notif.read) {
                            const supabase = createClient();
                            const { error } = await supabase
                              .from("notifications")
                              .update({ read: true })
                              .eq("id", notif.id);

                            if (!error) {
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notif.id ? { ...n, read: true } : n
                                )
                              );
                              setNotifLoading(null);
                              if (notif.design_id) {
                                setShowNotifModal(false);
                                // Use a small delay to ensure state is flushed before navigation
                                setTimeout(() => {
                                  router.push(`/designs/${notif.design_id}`);
                                }, 500);
                              }
                            } else {
                              setNotifLoading(null);
                              toast.error("Failed to mark notification as read.");
                            }
                          } else {
                            setNotifLoading(null);
                            if (notif.design_id) {
                              setShowNotifModal(false);
                              router.push(`/designs/${notif.design_id}`);
                            }
                          }
                        }}
                      >
                        {!notif.read && (
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        )}
                        {notif.type === "heart" ? (
                          <span className="text-red-500">♥</span>
                        ) : (
                          <span className="text-blue-500">💬</span>
                        )}
                        <span>
                          {notif.type === "heart"
                            ? <><b>{notif.from_user?.full_name ?? "Someone"}</b> loved your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                            : <><b>{notif.from_user?.full_name ?? "Someone"}</b> commented on your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                          }
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                        {/* Mark as read */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const supabase = createClient();
                            const { error } = await supabase
                              .from("notifications")
                              .update({ read: true })
                              .eq("id", notif.id);
                            if (!error) {
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notif.id ? { ...n, read: true } : n
                                )
                              );
                              toast.success("Marked as read.");
                            } else {
                              toast.error("Failed to mark as read.");
                            }
                          }}
                          className="ml-2 text-gray-400 hover:text-green-600 transition-opacity opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                          aria-label="Mark as read"
                          type="button"
                        >
                          <IconBell size={16} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteNotification(notif.id);
                          }}
                          className="ml-2 text-gray-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                          title="Delete notification"
                          aria-label="Delete notification"
                          type="button"
                        >
                          <IconX size={16} />
                        </button>
                      </li>
                    ))}
                  </>
                )}

                {/* Divider between unread and read */}
                {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                  <li className="border-t border-gray-200 dark:border-gray-700 my-2"></li>
                )}

                {/* Read notifications */}
                {readNotifications.length > 0 && (
                  <>
                    <li className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
                      Read
                    </li>
                    {readNotifications.map((notif) => (
                      <li
                        key={notif.id}
                        className="flex items-center gap-2 text-sm group rounded px-2 py-1 text-muted-foreground"
                      >
                        {notif.type === "heart" ? (
                          <span className="text-red-500">♥</span>
                        ) : (
                          <span className="text-blue-500">💬</span>
                        )}
                        <span>
                          {notif.type === "heart"
                            ? <><b>{notif.from_user?.full_name ?? "Someone"}</b> loved your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                            : <><b>{notif.from_user?.full_name ?? "Someone"}</b> commented on your design <b>{notif.designs?.title ?? notif.design_id}</b></>
                          }
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                        {/* Mark as Unread Button */}
                        <button
                          onClick={async () => {
                            const supabase = createClient();
                            const { error } = await supabase
                              .from("notifications")
                              .update({ read: false })
                              .eq("id", notif.id);
                            if (!error) {
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notif.id ? { ...n, read: false } : n
                                )
                              );
                              toast.success("Marked as unread.");
                            } else {
                              toast.error("Failed to mark as unread.");
                            }
                          }}
                          className="ml-2 text-gray-400 hover:text-orange-500 transition-opacity opacity-0 group-hover:opacity-100"
                          title="Mark as unread"
                          aria-label="Mark as unread"
                          type="button"
                        >
                          <IconBell size={16} />
                        </button>
                        <button
                          onClick={async () => await handleDeleteNotification(notif.id)}
                          className="ml-2 text-gray-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                          title="Delete notification"
                          aria-label="Delete notification"
                          type="button"
                        >
                          <IconX size={16} />
                        </button>

                      </li>
                    ))}
                  </>
                )}
              </ul>

            )}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={notifPage === 1}
                  onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs">
                  Page {notifPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={notifPage === totalPages}
                  onClick={() => setNotifPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
            {/* Remove all the notifications here */}
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  toast(
                    "Are you sure you want to delete all notifications?",
                    {
                      action: {
                        label: "Yes, delete",
                        onClick: async () => {
                          const supabase = createClient();
                          const { error } = await supabase
                            .from("notifications")
                            .delete()
                            .eq("to_user_id", user?.id);
                          if (!error) {
                            setNotifications([]);
                            toast.success("All notifications cleared!");
                          } else {
                            toast.error("Failed to clear notifications.");
                          }
                        },
                      },
                      cancel: {
                        label: "Cancel",
                        onClick: () => { },
                      },
                      duration: 7000,
                      position: "top-center",
                    }
                  );
                }}
                disabled={notifications.length === 0}
                className={`${notifications.length === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
              >
                Remove All
              </Button>
              <Button variant="outline" onClick={() => setShowNotifModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}