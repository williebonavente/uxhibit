
import { IconDashboard, IconChartBar, IconFolder, IconSearch } from "@tabler/icons-react";

export const navLinks = {
  user: {
    name: "John Doe",
    email: "JohnDoe@gmail.com",
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
    {
      title: "Explore",
      url: "/explore",
      icon: IconSearch,
    },
  ],
};
