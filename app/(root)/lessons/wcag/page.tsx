"use client";

import { useState } from "react";
import {
  IconBook,
  IconAccessible,
  IconEye,
  IconKeyboard,
  IconFileText,
  IconChecklist,
  IconChevronDown
} from "@tabler/icons-react";

import WcagContent from "@/components/lessons/introduction-to-wcag/introduction-content";

import WcagPourContent from "@/components/lessons/wcag-pour-principles/pour-content";

const lessons = [
  {
    title: "Introduction to WCAG",
    icon: IconBook,
    content: <WcagContent />
  },
  {
    title: "Principles (POUR)",
    icon: IconEye,
    content: <WcagPourContent />
  },
];

export default function Wcag() {
  const [openIndexes, setOpenIndexes] = useState<number[]>(
    lessons.map((_, idx) => idx)
  );

  const toggle = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter(i => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">Web Content Accessibility Guidelines (WCAG) 2.1</h1>
      </div>

      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-['Poppins']">
        Learn the essentials of web accessibility using WCAG 2.1 guidelines. Each principle is explained with practical examples and interactive exercises to help you create websites that are usable for everyone.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5">
        {lessons.map((lesson, index) => (
          <div
            key={index}
            className="border rounded-lg transition bg-accent dark:bg-[#1A1A1A]"
          >
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => toggle(index)}
            >
              <div className="flex items-center space-x-3">
                <lesson.icon className="w-7 h-7 text-[#ED5E20]" />
                <p className="text-xl font-semibold">{lesson.title}</p>
              </div>
              <IconChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndexes.includes(index) ? "rotate-180" : ""
                }`}
              />
            </div>
            {openIndexes.includes(index) && (
              <div className="p-5 pt-0 text-gray-700 dark:text-gray-200 text-sm">
                {lesson.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
