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

  useEffect(() => {
    async function fetchData() {
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
    fetchData();
  }, []);


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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{getInitials(dbName)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/* Getting the name from the database */}
                <span className="truncate font-medium">{dbName}</span>

                {/* <span className="truncate font-medium">{dbName}</span> */}
                <span className="text-muted-foreground truncate text-xs">
                  {/* Getting the email from the database */}
                  <span className="truncate font-medium">{dbName}</span>

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
              <DropdownMenuItem>
                <IconUserCircle />
                {/* TODO: make the functional button here */}
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
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
  );
}
