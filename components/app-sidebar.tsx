"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { navLinks } from "@/constants/navLinks";
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


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const logoSrc =
    resolvedTheme === "dark"
      ? "/uxhibit-logo-dark-mode.svg"
      : "/uxhibit-logo-light-mode.svg";

  return (
    <Sidebar className="p-8" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="aspect-square flex justify-center items-center">
              <Image src={logoSrc} alt="Logo" fill priority />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navLinks.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navLinks.user} />
      </SidebarFooter>
    </Sidebar>
  );
}