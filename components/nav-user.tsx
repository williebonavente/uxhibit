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
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
// import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@radix-ui/react-dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useUserStore } from "@/utils/supabase/store/user";
export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const [dbName, setDbName] = useState<string>("");
  const [dbEmail, setDbEmail] = useState<string>("");
  const [open, setOpen] = useState(false);
  // const [profile, setProfile] = useState<{ name: string; email: string; age: number; image_url?: string } | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    email: string;
    age: number;
    image_url?: string;
    newAvatarFile?: File;
  } | null>(null);

  // const { setUser } = useUserStore();
  useEffect(() => {
    async function fetchNameAndEmail() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        const { data } = await supabase
          .from("learner_profile")
          .select("name, email")
          .eq("id", authData.user.id)
          .single();
        if (data?.name) setDbName(data.name);
        if (data?.email) setDbEmail(data.email);
      }
    }
    fetchNameAndEmail();
  }, []);

  // Fetch full profile for modal only when needed
  const handleAccountClick = async () => {
    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user?.id) {
      const { data } = await supabase
        .from("learner_profile")
        .select("id, name, email, age, image_url")
        .eq("id", authData.user.id)
        .single();
      setProfile(data);
      setOpen(true);
    }
  };

  // Logout function
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
                <Avatar className="h-8 w-8 rounded-bl-full grayscale">
                  {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                  <AvatarImage
                    src={profile?.image_url || user.avatar}
                    alt={profile?.name || user.name}
                  />
                  {/* Display the avatar */}
                  <AvatarFallback className="rounded-lg">
                    {getInitials(dbName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* Getting the name from the database */}
                  <span className="truncate font-medium">{dbName}</span>

                  {/* <span className="truncate font-medium">{dbName}</span> */}
                  <span className="text-muted-foreground truncate text-xs">
                    {/* Getting the email from the database */}
                    <span className="truncate font-medium">{dbEmail}</span>
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
                    {/* <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name}</AvatarFallback> */}
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{dbName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      <span className="truncate font-medium">{dbEmail}</span>
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
              <DropdownMenuItem onClick={handleLogOut}>
                <IconLogout />
                Log out
              </DropdownMenuItem>
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
                  // Image url for avatar
                  let imageUrl = profile.image_url;
                  // Uploading avatar profile
                  if (profile.newAvatarFile) {
                    const { data: uploadData, error: uploadError } =
                      await supabase.storage
                        .from("avatars")
                        .upload(`public/${profile.id}`, profile.newAvatarFile, {
                          cacheControl: "3600",
                          upsert: true,
                        });

                    if (uploadError) {
                      console.error("Upload error: ", uploadError);
                      toast.error(uploadError.message);
                      return;
                    }
                    // Get the public URL
                    const { data: publicUrlData } = supabase.storage
                      .from("avatars")
                      .getPublicUrl(`public/${profile.id}`);
                    imageUrl = publicUrlData.publicUrl;
                  }
                  const { error } = await supabase
                    .from("learner_profile")
                    .update({
                      name: profile.name,
                      email: profile.email,
                      // Insert validation about the age no negative and over 100
                      age: profile.age,
                      image_url: imageUrl,
                    })
                    .eq("id", profile.id);
                  if (!error) {
                    toast.success("Profile Updated!");
                    setDbName(profile.name);
                    setDbEmail(profile.email);
                    setOpen(false);
                    // {Watch this code carefully}
                    // setUser({
                    //   id: profile.id,
                    //   name: profile.name,
                    //   email: profile.email,
                    //   age: profile.age,
                    // });
                    router.refresh();
                  } else {
                    toast.error("Failed to update profile");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label>Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Email</label>
                  <Input
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Age</label>
                  <Input
                    type="number"
                    value={profile.age ?? ""}
                    onChange={(e) =>
                      setProfile({ ...profile, age: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label>Avatar</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProfile({
                          ...profile,
                          newAvatarFile: e.target.files[0],
                        });
                      }
                    }}
                  />
                </div>
                {/* Upload  Avatar here! */}
                <footer className="flex justify-end gap-2">
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
                    className="cursor-pointer bg-[#ED5E20] text-white px-8 py-2 rounded-md hover:bg-orange-600 hover:cursor-pointer text-sm"
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
