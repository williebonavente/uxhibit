import { IconDashboard, IconChartBar, IconFolder, IconRadar, IconTrendingUp, 
      IconCompass, IconProps, IconSearch, 
      IconAB2} from "@tabler/icons-react";

export interface NavMainLink {
  title: string,
  url: string,
  icon: React.FC<IconProps>;
  items?: NavMainLink[];
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
    ]
  },
  {
    title: "Lessons",
    url: "/lessons",
    icon: IconFolder
  },
  {
    title: "Explore",
    url: "/explore",
    icon: IconSearch, 
  },
  {
    title: "Test",
    url: "/test",
    icon: IconAB2
  }
]

