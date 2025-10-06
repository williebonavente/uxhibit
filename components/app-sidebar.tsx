"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { navMain } from "@/constants/navLinks";
// import Link from "next/link";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Supabase getUser error:", error);
      }
      setUser(data?.user ?? null);
    };
    fetchUser();

    // Refetch user on auth state change
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!mounted) return null;


  const logoSrc =
    resolvedTheme === "dark"
      ? "/uxhibit-logo-dark-mode.svg"
      : "/uxhibit-logo-light-mode.svg";

  return (
    <Sidebar className="p-4" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="aspect-square flex justify-center items-center">
              <Image src={logoSrc} alt="Logo" fill priority className="p-4" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooter>
          {user ? <NavUser user={user} /> : null}
        </SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  );
}