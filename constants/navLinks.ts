
import { IconDashboard, IconChartBar, IconFolder } from "@tabler/icons-react";

export const navLinks = {
  user: {
    name: "Vanness Lao",
    email: "vannesslao01@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Lessons",
      url: "/lessons",
      icon: IconFolder,
    },
  ],
};
