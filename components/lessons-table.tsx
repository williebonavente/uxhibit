"use client";

import Link from "next/link";
import Image from "next/image";

const heuristics = [
  {
    name: "Visibility of System Status",
    link: "https://www.nngroup.com/articles/visibility-system-status/",
    icon: "/lessons-png/1.png",
    description: "Keep users informed about what’s happening.",
    example: "A loading spinner while data is being fetched.",
  },
  {
    name: "Match Between System and the Real World",
    link: "https://www.nngroup.com/articles/ten-usability-heuristics/",
    icon: "/lessons-png/2.png",
    description: "Use familiar language and concepts.",
    example: "Trash bin icon represents deleting files.",
  },
  {
    name: "User Control and Freedom",
    link: "https://www.nngroup.com/articles/user-control-and-freedom/",
    icon: "/lessons-png/3.png",
    description: "Allow users to undo and redo actions easily.",
    example: "Cancel button when filling a form.",
  },
  {
    name: "Consistency and Standards",
    link: "https://www.nngroup.com/articles/consistency-and-standards/",
    icon: "/lessons-png/4.png",
    description: "Follow platform conventions to avoid confusion.",
    example: "Using the same icon style for similar actions.",
  },
  {
    name: "Error Prevention",
    link: "https://www.nngroup.com/articles/error-prevention/",
    icon: "/lessons-png/5.png",
    description: "Design to prevent problems before they occur.",
    example: "Disabling 'Submit' until required fields are filled.",
  },
  {
    name: "Recognition Rather Than Recall",
    link: "https://www.nngroup.com/articles/recognition-and-recall/",
    icon: "/lessons-png/6.png",
    description: "Make options visible and easy to recognize.",
    example: "Showing a list of recent documents instead of asking names.",
  },
  {
    name: "Flexibility and Efficiency of Use",
    link: "https://www.nngroup.com/articles/flexibility-efficiency-heuristic/",
    icon: "/lessons-png/7.png",
    description: "Allow shortcuts for expert users.",
    example: "Keyboard shortcuts or quick-access buttons.",
  },
  {
    name: "Aesthetic and Minimalist Design",
    link: "https://www.nngroup.com/articles/aesthetic-minimalist-design/",
    icon: "/lessons-png/8.png",
    description: "Only show relevant information.",
    example: "Minimal form fields with essential details only.",
  },
  {
    name: "Help Users Recognize, Diagnose, and Recover from Errors",
    link: "https://www.nngroup.com/articles/error-message-guidelines/",
    icon: "/lessons-png/9.png",
    description: "Provide clear error messages and recovery options.",
    example: "Form validation messages with guidance to fix issues.",
  },
  {
    name: "Help and Documentation",
    link: "https://www.nngroup.com/articles/help-and-documentation/",
    icon: "/lessons-png/10.png",
    description: "Offer helpful instructions when needed.",
    example: "Tooltip explanations or a searchable help page.",
  },
];

export default function HeuristicCarousel() {
  return (
    <div className="grid grid-cols-5 gap-5">
      {heuristics.map((h, i) => (
        <div
          key={i}
          className="bg-accent dark:bg-[#1A1A1A] rounded-xl shadow-md flex flex-col p-3 hover:scale-[1.05] transition-transform duration-200 cursor-pointer gap-2 justify-center"
        >
          <Link href={h.link} target="_blank" rel="noopener noreferrer">
            <div className="w-full h-40 relative rounded-lg overflow-hidden bg-white dark:bg-accent mb-3 border">
              <Image
                src={h.icon}
                alt={h.name}
                fill
                className="object-cover"
              />
            </div>
          </Link>

          <div className="flex flex-col text-start gap-2 h-full justify-start">
            <span className="font-semibold break-words leading-5">{h.name}</span>
            <p className="text-xs text-gray-800 dark:text-gray-400">
              {h.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
