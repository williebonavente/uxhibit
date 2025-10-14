"use client";
import {
  IconCirclePlusFilled,
  Icon,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  items?: NavItem[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]); // Analytics closed by default

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link href="/evaluate" className="block w-full">
              <SidebarMenuButton
                tooltip="Evaluate"
                className={`
                  group relative inline-flex items-center justify-center
                  px-6 py-3 rounded-xl font-semibold tracking-wide
                  transition-all duration-300 cursor-pointer
                  text-white
                  hover:text-white
                  shadow-[0_0_10px_rgba(255,138,0,0.45)]
                  hover:shadow-[0_0_10px_rgba(255,138,0,0.65)]
                  active:scale-[.97]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5E20]/40
                `}
              >
                {/* Glow / gradient base */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFDB97] via-[#FFA600] to-[#FF4D00]"
                />

                {/* Inner glass layer */}
                <span
                  aria-hidden
                  className="absolute inset-[2px] rounded-[10px] 
                            bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.08))]
                            backdrop-blur-[1.5px]"
                />

                {/* Animated sheen */}
                <span
                  aria-hidden
                  className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                >
                  <span
                    className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                                  bg-gradient-to-r from-transparent via-white/40 to-transparent
                                  opacity-0 transition-all duration-700
                                  group-hover:translate-x-[220%] group-hover:opacity-70"
                  />
                </span>

                {/* Border ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl ring-1 ring-white/20 group-hover:ring-white/40"
                />

                {/* Label with Icon */}
                <span className="relative z-10 flex items-center gap-2">
                  <IconCirclePlusFilled className="h-5 w-5" />
                  <span>Evaluate</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            const hasSubItems = item.items && item.items.length > 0;
            const isOpen = openItems.includes(item.title);
            const isParentActive =
              hasSubItems &&
              item.items?.some((subItem) => pathname === subItem.url);

            return (
              <SidebarMenuItem key={item.title}>
                {hasSubItems ? (
                  <>
                    <SidebarMenuButton
                      onClick={() => toggleItem(item.title)}
                      tooltip={item.title}
                      className={`justify-start ${
                        isParentActive
                          ? "bg-[rgba(237,94,32,0.15)] text-[#ED5E20] font-semibold hover:text-[#ED5E20]"
                          : ""
                      }`}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <IconChevronDown
                        className={`ml-auto transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        size={16}
                      />
                    </SidebarMenuButton>
                    {isOpen && (
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`justify-start pl-2 ${
                                  isSubActive
                                    ? "bg-[rgba(237,94,32,0.15)] text-[#ED5E20] font-semibold hover:text-[#ED5E20] hover:cursor-default"
                                    : ""
                                }`}
                              >
                                <Link href={subItem.url}>
                                  <span className="text-xs">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`justify-start ${
                      isActive
                        ? "bg-[rgba(237,94,32,0.15)] text-[#ED5E20] font-semibold hover:text-[#ED5E20] hover:cursor-default"
                        : ""
                    }`}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
