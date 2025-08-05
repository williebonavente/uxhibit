import { IconDashboard, IconChartBar, IconFolder, IconRadar, IconTrendingUp, IconCompass } from "@tabler/icons-react";

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
      items: [
        {
          title: "Heuristic Violation Frequency",
          url: "/analytics/heuristic-violation-frequency",
          icon: IconRadar,
        },
        {
          title: "Usability Score Trend",
          url: "/analytics/usability-score-trend",
          icon: IconTrendingUp,
        },
        {
          title: "Project Performance Comparison",
          url: "/analytics/project-performance",
          icon: IconCompass,
        },
      ],
    },
    {
      title: "Lessons",
      url: "/lessons",
      icon: IconFolder,
    },
  ],
};