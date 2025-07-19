"use client";

import { IconCirclePlusFilled, Icon, IconMail } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link href="/evaluate" className="block w-full">
              <SidebarMenuButton
                tooltip="Evaluate Design"
                className="bg-[linear-gradient(90deg,_#FFDB97,_#FFA600,_#FF8700,_#FF4D00)] text-white font-semibold hover:shadow-[0_0_5px_0.5px_#FFA600] hover:text-white active:bg-primary active:text-primary-foreground min-w-8 duration-200 ease-linear justify-center"
              >
                <IconCirclePlusFilled />
                <span>Evaluate Design</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`justify-start ${
                      isActive
                        ? "bg-[rgba(237,94,32,0.15)] text-[#ED5E20] font-semibold hover:text-[#ED5E20] hover:cursor-default"
                        : ""
                    }`}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
