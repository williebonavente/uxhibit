"use client";

import {
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconSettings,
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
import { Button } from "./ui/button";
import { type User } from "@supabase/supabase-js";
import { Skeleton } from "./ui/skeleton";
import { Bug, UserRound, Trash } from "lucide-react";
import { useDesignNotifications } from "../lib/notification"
import { IconBell, IconX } from "@tabler/icons-react";
import { ReportBugModal } from "./report-bug-modal";
import { AccountInfoModal } from "./account-info-modal";
import  DeleteAccountPage  from "./delete-account-dialog";
import { NotificationsModal } from "./notifcation-modal";


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
  const [showReportBug, setShowReportBug] = useState(false);

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

  // TODO: BE DELETED
  const heartNotification = useDesignNotifications(user?.id ?? null);
  const hasHeartNotifications = heartNotification.length > 0;

  const handleProfileClick = async () => {
    const supabase = createClient();

    // Get current user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) return;

    const userId = authData.user.id;

    // Redirect to your profile page
    router.push(`/profile-user/${userId}`);
  };

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
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground py-7"
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
                <DropdownMenuItem onClick={handleProfileClick}>
                  <IconUserCircle />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotifModal(true)}>
                  <IconNotification />
                  Notifications
                  {notifications.some(n => !n.read) && (
                    <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <UserRound />
                  About Us
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAccountClick}>
                  <IconSettings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bug />
                  Report a Bug
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                  <Trash />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogOut}> <IconLogout /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <ReportBugModal
        open={showReportBug}
        onClose={() => setShowReportBug(false)}
        user={
          profile
            ? {
              avatarUrl:
                profile.avatar_url && profile.avatar_url.startsWith("http")
                  ? profile.avatar_url
                  : profile.avatar_url
                    ? `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`
                    : "",
              fullName: profile.fullname,
            }
            : null
        }
      />
      <AccountInfoModal
        open={open}
        setOpen={setOpen}
        profile={profile}
        setProfile={setProfile}
        email={email}
        setFullName={setFullName}
        setAvatarUrl={setAvatarUrl}
        getProfile={getProfile}
      />
      <DeleteAccountPage
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        userId={user?.id}
        email={user?.email}
      />

      <NotificationsModal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        user={user}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadNotifications={unreadNotifications}
        readNotifications={readNotifications}
        notifLoading={notifLoading}
        setNotifLoading={setNotifLoading}
        notifPage={notifPage}
        setNotifPage={setNotifPage}
        totalPages={totalPages}
        handleDeleteNotification={handleDeleteNotification}
      />
    </>
  );
}