import {
  IconDashboard, IconChartBar, IconBook, IconRadar, IconTrendingUp,
  IconCompass, IconProps, IconSearch, IconAccessible, IconBulb
} from "@tabler/icons-react";

export interface NavMainLink {
  title: string,
  url: string,
  icon: React.FC<IconProps>;
  items?: NavMainLink[];
}
export const navMain: NavMainLink[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: IconChartBar,
    items: [
      {
        title: "Heuristic Violation",
        url: "/analytics/heuristic-violation-frequency",
        icon: IconRadar,
      },
      {
        title: "Usability Trend",
        url: "/analytics/usability-score-trend",
        icon: IconTrendingUp,
      },
      {
        title: "Project Comparison",
        url: "/analytics/project-performance",
        icon: IconCompass,
      },
    ]
  },
  {
    title: "Lessons",
    url: "/lessons",
    icon: IconBook,
    items: [
      {
        title: "WCAG 2.1",
        url: "/lessons/wcag",
        icon: IconAccessible,
      },
      {
        title: "10 Usability Heuristics",
        url: "/lessons/usability-heuristics",
        icon: IconBulb,
      },
    ]
  },
  {
    title: "Explore",
    url: "/explore",
    icon: IconSearch,
  },


]

