"use client";

import { Button } from "@/components/ui/button";

const heuristics = [
  {
    name: "Visibility of System Status",
    link: "https://www.nngroup.com/articles/visibility-system-status/",
    icon: "/lesson-icons/eye.svg",
  },
  {
    name: "Match Between System and the Real World",
    link: "https://www.nngroup.com/articles/ten-usability-heuristics/",
    icon: "/lesson-icons/realworld.svg",
  },
  {
    name: "User Control and Freedom",
    link: "https://www.nngroup.com/articles/user-control-and-freedom/",
    icon: "/lesson-icons/unlock.svg",
  },
  {
    name: "Consistency and Standards",
    link: "https://www.nngroup.com/articles/consistency-and-standards/",
    icon: "/lesson-icons/check.svg",
  },
  {
    name: "Error Prevention",
    link: "https://www.nngroup.com/articles/error-prevention/",
    icon: "/lesson-icons/shield.svg",
  },
  {
    name: "Recognition Rather Than Recall",
    link: " https://www.nngroup.com/articles/recognition-and-recall/",
    icon: "/lesson-icons/brain.svg",
  },
  {
    name: "Flexibility and Efficiency of Use",
    link: "https://www.nngroup.com/articles/flexibility-efficiency-heuristic/ ",
    icon: "/lesson-icons/lightning.svg",
  },
  {
    name: "Aesthetic and Minimalist Design",
    link: "https://www.nngroup.com/articles/aesthetic-minimalist-design/",
    icon: "/lesson-icons/layout.svg",
  },
  {
    name: "Help Users Recognize, Diagnose, and Recover from Errors",
    link: "https://www.nngroup.com/articles/error-message-guidelines/ ",
    icon: "/lesson-icons/alert.svg",
  },
  {
    name: "Help and Documentation",
    link: "https://www.nngroup.com/articles/help-and-documentation/",
    icon: "/lesson-icons/book.svg",
  },
];

export default function HeuristicLinks() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {heuristics.map((h, i) => (
        <Button
          key={i}
          asChild
          className="w-full py-8 p-10 justify-start text-left gap-3 bg-[#ED5E20]/10 hover:bg-[#ED5E20]/25"
          variant="secondary"
        >
          <a href={h.link} target="_blank" rel="noopener noreferrer">
            <img src={h.icon} alt="" className="w-8 h-8" />
            {h.name}
          </a>
        </Button>
      ))}
    </div>
  );
}
