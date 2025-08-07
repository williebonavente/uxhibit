
import { IconDashboard, IconChartBar, IconFolder, IconProps } from "@tabler/icons-react";

export interface NavMainLink {
  title: string,
  url: string,
  icon: React.FC<IconProps>;
}
export const navMain: NavMainLink[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: IconChartBar,
  },
  {
    title: "Lessons",
    url: "/lessons",
    icon: IconFolder
  }
]


