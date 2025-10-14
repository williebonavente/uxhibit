import {
  Book,
  Eye,
  Keyboard,
  FileText,
  Lightbulb,
  Globe,
  Trophy,
  Activity,
  MousePointer,
  Clock,
} from "lucide-react";

import Image from "next/image";

export default function WcagPourContent() {
  return (
    <div className="mt-5 space-y-10">
      {/* Header */}
      <div className="space-y-2 w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white w-full">
          WCAG 2.1 Accessibility: Learning POUR Principles
        </h1>
        <p className="text-start text-gray-600 dark:text-gray-300 w-full">
          Welcome to your interactive lesson! We&apos;ll explore the four principles
          that guide web accessibility: Perceivable, Operable, Understandable,
          and Robust. Think of me as your virtual instructor walking you through
          each concept.
        </p>
      </div>

      {/* Principles Overview Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700">
        <h2 className="text-2xl font-semibold mb-4 text-[#ED5E20]">
          POUR Principles Overview
        </h2>
        <p className="mb-4">
          Let&apos;s break down POUR. Each principle ensures your website is usable
          by all people, including those with disabilities. We&apos;ll cover what it
          means, why it matters, and practical ways to implement it.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
          {[
            {
              title: "Perceivable",
              desc: "Make content detectable by sight, sound, or touch.",
              icon: <Eye className="w-10 h-10 text-[#ED5E20]" />,
            },
            {
              title: "Operable",
              desc: "Ensure users can navigate and interact with the interface using various input methods.",
              icon: <Keyboard className="w-10 h-10 text-[#ED5E20]" />,
            },
            {
              title: "Understandable",
              desc: "Make content clear, predictable, and easy to follow.",
              icon: <FileText className="w-10 h-10 text-[#ED5E20]" />,
            },
            {
              title: "Robust",
              desc: "Ensure compatibility across browsers, devices, and assistive technologies.",
              icon: <Lightbulb className="w-10 h-10 text-[#ED5E20]" />,
            },
          ].map((principle) => (
            <div
              key={principle.title}
              className="flex items-center space-x-5 p-5 bg-gray-50 dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition"
            >
              {principle.icon}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {principle.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {principle.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Lessons */}
      {[
        {
          title: "Perceivable",
          icon: <Eye className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="space-y-6 mx-auto">
              {/* Learning Goals */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Learning Goals
                  </h2>
                </div>
                By the end of this lesson, you will be able to:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Explain what “Perceivable” means in accessibility and why it
                    matters in UX design.
                  </li>
                  <li>
                    Identify key WCAG 2.1 success criteria under the Perceivable
                    principle.
                  </li>
                  <li>
                    Apply perceivable design practices (alt text, captions,
                    contrast, etc.) when creating or evaluating user interfaces.
                  </li>
                </ul>
              </div>

              {/* Image */}
              <Image
                src="https://miro.medium.com/v2/resize:fit:720/format:webp/1*_HXLnIM_2VzbaYxZs3a0qw.png"
                alt="WCAG Perceivable Principle"
                className="w-full rounded-xl shadow-md"
                height={405}
                width={720}
              />

              {/* What Does Perceivable Mean */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Eye className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    What Does “Perceivable” Mean?
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  For content to be perceivable, it must be presented in ways
                  that <strong>all users can sense and understand</strong>,
                  regardless of disability. If information can&apos;t be seen, heard,
                  or otherwise detected, then it&apos;s invisible to some users.
                  <br />
                  <br />
                  In short:{" "}
                  <strong>
                    If users can&apos;t perceive it, they can&apos;t use it.
                  </strong>
                </p>
              </div>

              {/* Text Alternatives */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    1.1 Text Alternatives
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>1.1.1 Non-text Content (Level A)</strong>
                  <br />
                  <br />
                  Provide <strong>text alternatives</strong> for all non-text
                  content (images, icons, buttons, charts).
                </p>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Informative images → add descriptive alt text.</li>
                  <li>Decorative images → mark as decorative.</li>
                  <li>Icons or buttons → use accessible labels.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Using “image123.png” as alt text.</li>
                  <li>No labels on icons that perform actions.</li>
                </ul>
              </div>

              {/* Time-Based Media */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    1.2 Time-based Media
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Time-based media includes audio and video content. Users who
                  cannot see or hear need <strong>alternatives</strong>.
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>1.2.1 Audio-only/Video-only (Prerecorded):</strong>{" "}
                    Provide transcript for audio; description for video.
                  </li>
                  <li>
                    <strong>1.2.2 Captions (Prerecorded):</strong> Add captions
                    for all spoken content in videos. content in videos
                  </li>
                  <li>
                    <strong>
                      1.2.3 Audio Description or Media Alternative
                      (Prerecorded):
                    </strong>
                    Narration or text alternative for important visuals.
                  </li>
                </ul>
                <p className="text-gray-500 dark:text-gray-400">
                  👉 These apply if your design or product uses multimedia.
                  <br />
                  👉 Live captions, sign language, or extended descriptions
                  exist in WCAG, but are optional/advanced for UXhibit lessons.
                </p>
              </div>

              {/* Adaptable Content */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Book className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    1.3 Adaptable Content
                  </h2>
                </div>
                Design content that can adapt to different users and
                technologies.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>1.3.1 Info & Relationships:</strong> Use proper
                    structure (headings, lists, labels) so relationships are
                    clear even without visual formatting.
                  </li>
                  <li>
                    <strong>1.3.2 Meaningful Sequence:</strong> Ensure
                    reading/order makes sense (e.g., forms, navigation).
                  </li>
                  <li>
                    <strong>1.3.3 Sensory Characteristics:</strong> Don&apos;t rely
                    only on color, shape, or position (e.g., “Press the green
                    button” should also say “Press the Start button”).
                  </li>
                  <li>
                    <strong>1.3.4 Orientation:</strong> Support both portrait
                    and landscape modes.
                  </li>
                  <li>
                    <strong>1.3.5 Identify Input Purpose:</strong> Inputs like
                    “email,” “phone,” or “address” should be identifiable by
                    assistive tech.
                  </li>
                  <li>
                    <strong>1.3.6 Identify Purpose:</strong> Common UI
                    components (navigation, footers, etc.) should have
                    consistent and recognizable purpose.
                  </li>
                </ul>
              </div>

              {/* Distinguishable Content */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    1.4 Distinguishable Content
                  </h2>
                </div>
                Make it easy for users to see and hear content.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>1.4.1 Use of Color:</strong> Don&apos;t use color alone
                    to convey meaning (add icons, labels).
                  </li>
                  <li>
                    <strong>1.4.2 Audio Control:</strong> Provide a way to
                    pause/stop audio that auto-plays for more than 3 seconds.
                  </li>
                  <li>
                    <strong>1.4.3 Contrast (Minimum):</strong> Text should have
                    a contrast ratio of at least 4.5:1 (normal) or 3:1 (large
                    text).
                  </li>
                  <li>
                    <strong>1.4.4 Resize Text:</strong> Allow text to be resized
                    up to 200% without breaking layout.
                  </li>
                  <li>
                    <strong>1.4.5 Images of Text:</strong> Avoid using images
                    instead of real text, unless essential (e.g., logos).
                  </li>
                  <li>
                    <strong>1.4.6 Low/No Background Audio:</strong> Ensure
                    speech isn&apos;t drowned out by background audio.
                  </li>
                  <li>
                    <strong>1.4.7 Visual Presentation:</strong> Provide options
                    to adjust spacing, line height, etc.
                  </li>
                  <li>
                    <strong>1.4.8 Reflow:</strong> Content should reflow without
                    horizontal scrolling on small screens.
                  </li>
                  <li>
                    <strong>1.4.9 Non-text Contrast:</strong> Icons, form
                    inputs, and visual UI components must also have enough
                    contrast.
                  </li>
                  <li>
                    <strong>1.4.10 Text Spacing:</strong> Users should be able
                    to adjust line height, spacing, and letter spacing without
                    breaking content.
                  </li>
                  <li>
                    <strong>1.4.11 Content on Hover/Focus:</strong> Tooltips,
                    popups, or hover states should be dismissible, hoverable,
                    and persistent long enough to be read.
                  </li>
                </ul>
              </div>

              {/* Quick Self-Check */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Quick Self-Check (Exercices)
                  </h2>
                </div>
                <br />
                1. Look at a UI screen (your own or a sample). Can every
                icon/button be understood without color alone?
                <br />
                <br />
                2. Check if text has enough contrast with its background. Use an
                online contrast checker.
                <br />
                <br />
                3. Resize text by 200%. Does the layout still work? Watch a
                video. Does it have captions?
                <br />
                <br />
                4. Hover over a tooltip or popup in a design. Can you dismiss it
                easily with the keyboard?
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Summary
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  The <strong>Perceivable</strong> principle ensures that
                  information and UI elements are available to all users,
                  regardless of their abilities. By applying text alternatives,
                  adaptable structures, sufficient contrast, and accessible
                  media, designers create products that are both{" "}
                  <strong>usable and inclusive</strong>.
                  <br />
                  <br />
                  👉 Remember:{" "}
                  <i>
                    If a user can&apos;t perceive it, they can&apos;t interact with it.
                  </i>
                </p>
              </div>
            </div>
          ),
        },
        {
          title: "Operable",
          icon: <Keyboard className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="space-y-6 mx-auto">
              {/* Learning Goals */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Learning Goals
                  </h2>
                </div>
                By the end of this lesson, you will be able to:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Explain what “Operable” means in accessibility and why it
                    matters in UX design.
                  </li>
                  <li>
                    Identify key WCAG 2.1 success criteria under the Operable
                    principle.
                  </li>
                  <li>
                    Apply operable design practices (keyboard support,
                    navigation, safe animations, touch-friendly targets) when
                    creating or evaluating user interfaces.
                  </li>
                </ul>
              </div>

              {/* Image */}
              <Image
                src="https://miro.medium.com/v2/resize:fit:720/format:webp/1*QLaQWdVMux9F2qVWLtjOgg.jpeg"
                alt="WCAG Robust Principle"
                width={720}
                height={405}
                className="w-full rounded-xl shadow-md"
              />

              {/* What Does Operable Mean */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    What Does “Operable” Mean?
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  For content to be operable,{" "}
                  <strong>users must be able to interact with it</strong>. If
                  buttons, links, menus, or forms can&apos;t be used with different
                  input methods (like keyboard, mouse, or touch), then some
                  users will be blocked from using the interface.
                  <br />
                  <br />
                  👉 In short:{" "}
                  <i>If users can&apos;t operate it, they can&apos;t use it.</i>
                </p>
              </div>

              {/* 2.1 Keyboard Accessible */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    2.1 Keyboard Accessible
                  </h2>
                </div>
                Ensure everything works without a mouse.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>2.1.1 Keyboard</strong> - All functionality (menus,
                    forms, buttons) should work with the keyboard
                  </li>
                  <li>
                    <strong>2.1.2 No Keyboard Trap</strong> - Users must not get
                    stuck inside a modal or widget when navigating with Tab
                  </li>
                  <li>
                    <strong>2.1.4 Character Key Shortcuts</strong> - Avoid
                    single-key shortcuts that interfere with typing
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Modal dialogs can be closed with <strong>Esc</strong> or by
                    tabbing to the close button.
                  </li>
                  <li>
                    Navigation menus expand and collapse using the keyboard.
                  </li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    A form field can only be clicked with a mouse and not
                    reached by Tab.
                  </li>
                </ul>
              </div>

              {/* 2.2 Enough Time */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    2.2 Enough Time
                  </h2>
                </div>
                Give users control over time limits.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>2.2.1 Timing Adjustable</strong> &ndash; If a form has a
                    timeout, allow extensions.
                  </li>
                  <li>
                    <strong>2.2.2 Pause, Stop, Hide</strong> &ndash; Users should be
                    able to pause or stop auto-moving content (like carousels).
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Carousels include <strong>Pause/Play</strong> buttons.
                  </li>
                  <li>Forms warn users before session timeout.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Auto-sliding banners with no controls.</li>
                </ul>
              </div>

              {/* 2.3 Seizures & Physical Reactions */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    2.3 Seizures & Physical Reactions
                  </h2>
                </div>
                Avoid harmful visuals.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>2.3.1 Three Flashes or Below Threshold</strong> -
                    Don&apos;t use flashing content that could trigger seizures.
                  </li>
                  <li>
                    <strong>2.3.3 Animation from Interactions</strong> - Keep
                    animations subtle; avoid motion sickness.
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Use smooth fades or slides instead of flashing.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>A button flashes rapidly when hovered.</li>
                </ul>
              </div>

              {/* 2.4 Navigable */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    2.4 Navigable
                  </h2>
                </div>
                Help users find and move around content easily.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>2.4.1 Bypass Blocks</strong> - Add a “Skip to
                    Content” link to skip repeated navigation.
                  </li>
                  <li>
                    <strong>2.4.2 Page Titled</strong> - Pages/screens should
                    have clear, descriptive titles.
                  </li>
                  <li>
                    <strong>2.4.3 Focus Order</strong> - Focus should follow a
                    logical sequence.
                  </li>
                  <li>
                    <strong>2.4.4 Link Purpose</strong> - Links should describe
                    their destination (not just “Click here”).
                  </li>
                  <li>
                    <strong>2.4.6 Headings & Labels</strong> - Use clear section
                    headers and form labels.
                  </li>
                  <li>
                    <strong>2.4.7 Focus Visible</strong> - The active element
                    should always be visually highlighted.
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Tabbing highlights which button/input is selected.</li>
                  <li>
                    Links clearly say “View Profile” instead of “Click here.”
                  </li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Users can&apos;t tell which input is active.</li>
                  <li>A vague link text like “Read more.”</li>
                </ul>
              </div>

              {/* 2.5 Input Modalities */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <MousePointer className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    2.5 Input Modalities
                  </h2>
                </div>
                Support different input methods (touch, keyboard, mouse).
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>2.5.1 Pointer Gestures</strong> - Use simple
                    gestures, not complex swipes.
                  </li>
                  <li>
                    <strong>2.5.2 Pointer Cancellation</strong> - Let users
                    cancel accidental taps or drags.
                  </li>
                  <li>
                    <strong>2.5.3 Label in Name</strong> - Accessible names
                    should match visible labels (e.g., mic button says “Voice
                    Search”).
                  </li>
                  <li>
                    <strong>2.5.4 Target Size</strong> - Buttons/touch targets
                    should be large enough (44x44px minimum).
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Large, easy-to-tap buttons on mobile.</li>
                  <li>Single-finger swipe gestures.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Requiring multi-finger gestures to complete an action.
                  </li>
                  <li>Tiny buttons that are hard to tap.</li>
                </ul>
              </div>

              {/* Quick Self-Check */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Quick Self-Check (Exercises)
                  </h2>
                </div>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Can every button, link, and form field be reached without a
                    mouse?
                  </li>
                  <li>Can carousels or banners be paused/stopped?</li>
                  <li>Are animations smooth/subtle, not flashing?</li>
                  <li>Is page navigation order logical with visible focus?</li>
                  <li>Are buttons on mobile big enough to tap easily?</li>
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Summary
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  The Operable principle ensures that{" "}
                  <strong>
                    users can interact with and navigate your product,
                    regardless of ability or device
                  </strong>
                  . By ensuring keyboard accessibility, giving control over
                  time, avoiding harmful animations, providing clear navigation,
                  and designing touch-friendly inputs, we create inclusive and
                  usable interfaces.
                  <br />
                  <br />
                  👉 Remember:{" "}
                  <i>If a user can&apos;t operate it, they can&apos;t use it.</i>
                </p>
              </div>
            </div>
          ),
        },
        {
          title: "Understandable",
          icon: <FileText className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="space-y-6 mx-auto">
              {/* Learning Goals */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Learning Goals
                  </h2>
                </div>
                By the end of this lesson, you will be able to:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Explain what “Understandable” means in accessibility and why
                    it matters in UX design.
                  </li>
                  <li>
                    Identify WCAG 2.1 success criteria that ensure users can
                    read, predict, and interact with content without confusion.
                  </li>
                  <li>
                    Apply design practices that improve clarity, predictability,
                    and input assistance in user interfaces.
                  </li>
                </ul>
              </div>

              {/* Image */}
              <Image
                src="https://appinventiv.com/wp-content/uploads/2019/02/Tips-to-Improve-UI-UX-Design.png"
                alt="WCAG Understandable Principle"
                width={1200}
                height={675}
                className="w-full rounded-xl shadow-md"
              />

              {/* What Does Understandable Mean */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    What Does “Understandable” Mean?
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  For content to be understandable, it must be{" "}
                  <strong>clear, consistent, and easy to use</strong>. If users
                  can&apos;t read, predict what will happen, or recover from errors,
                  they will struggle to interact with the interface.
                  <br />
                  <br />
                  👉 In short:{" "}
                  <i>If users can&apos;t understand it, they can&apos;t use it.</i>
                </p>
              </div>

              {/* 3.1 Readable */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    3.1 Readable
                  </h2>
                </div>
                Make text content easy to read and understand.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>3.1.1 Language of Page</strong> &ndash; Set the correct
                    language for the page (e.g., {'<html lang="en">'}).
                  </li>
                  <li>
                    <strong>3.1.2 Language of Parts</strong> &ndash; If a section uses
                    a different language (like a Spanish quote), mark it so
                    screen readers pronounce it correctly.
                  </li>
                  <li>
                    <strong>3.1.3 Unusual Words</strong> &ndash; Provide definitions
                    for jargon or unusual terms.
                  </li>
                  <li>
                    <strong>3.1.4 Abbreviations</strong> &ndash; Expand or explain
                    abbreviations at least once (e.g., “API (Application
                    Programming Interface)”).
                  </li>
                  <li>
                    <strong>3.1.5 Reading Level</strong> &ndash; Use clear, simple
                    language when possible. Provide summaries for complex
                    content.
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Adding a tooltip or glossary for technical terms.</li>
                  <li>Using plain language in buttons and instructions.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Overloading users with jargon or unexplained acronyms.
                  </li>
                </ul>
              </div>

              {/* 3.2 Predictable */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    3.2 Predictable
                  </h2>
                </div>
                Design interfaces that behave consistently and don&apos;t surprise
                the user.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>3.2.1 On Focus</strong> &ndash; Don&apos;t trigger unexpected
                    changes when an element receives focus.
                  </li>
                  <li>
                    <strong>3.2.2 On Input</strong> &ndash; Avoid auto-submitting
                    forms when a field is filled without user consent.
                  </li>
                  <li>
                    <strong>3.2.3 Consistent Navigation</strong> &ndash; Keep
                    menus/navigation in the same place across screens.
                  </li>
                  <li>
                    <strong>3.2.4 Consistent Identification</strong> &ndash; Use the
                    same icons, labels, and components consistently.
                  </li>
                  <li>
                    <strong>3.2.5 Change on Request</strong> &ndash; Only change major
                    settings (like language or layout) when the user asks for
                    it.
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    A search bar is always in the top-right corner across all
                    pages.
                  </li>
                  <li>
                    Clicking “Next” in a form moves to the next step, not
                    submitting everything unexpectedly.
                  </li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    A drop-down auto-refreshes the whole page without warning.
                  </li>
                  <li>
                    An icon for “settings” looks different in each section.
                  </li>
                </ul>
              </div>

              {/* 3.3 Input Assistance */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    3.3 Input Assistance
                  </h2>
                </div>
                Help users avoid and recover from mistakes.
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    <strong>3.3.1 Error Identification</strong> &ndash; Clearly
                    highlight fields with errors and explain the issue.
                  </li>
                  <li>
                    <strong>3.3.2 Labels or Instructions</strong> &ndash; Provide
                    clear labels and instructions for inputs (e.g., “Password
                    must include at least 8 characters”).
                  </li>
                  <li>
                    <strong>3.3.3 Error Suggestion</strong> &ndash; Suggest
                    corrections when possible (e.g., “Did you mean ___?”).
                  </li>
                  <li>
                    <strong>
                      3.3.4 Error Prevention (Legal, Financial, Data)
                    </strong>{" "}
                    &ndash; Confirm before submitting important actions (like
                    payments).
                  </li>
                  <li>
                    <strong>3.3.5 Help</strong> &ndash; Provide accessible help
                    options like FAQs, hints, or support links.
                  </li>
                </ul>
                <br />
                ✅ Good practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Showing “Email format is invalid” below an input.</li>
                  <li>Providing inline hints inside form fields.</li>
                  <li>Confirming before deleting an account.</li>
                </ul>
                <br />
                ❌ Bad practice:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Showing only a red outline with no error message.</li>
                  <li>
                    Letting users submit a financial transaction without review.
                  </li>
                </ul>
              </div>

              {/* Quick Self-Check */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Quick Self-Check (Exercises)
                  </h2>
                </div>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Does your page have the correct language code set?</li>
                  <li>Are unusual terms or abbreviations explained?</li>
                  <li>
                    Do forms or elements behave consistently without sudden
                    changes?
                  </li>
                  <li>
                    If a user makes an error, is it clear what went wrong and
                    how to fix it?
                  </li>
                  <li>
                    Can a user cancel or confirm before making an important
                    action?
                  </li>
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Summary
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  The Understandable principle ensures that{" "}
                  <strong>
                    content is readable, predictable, and forgiving of user
                    errors
                  </strong>
                  . By using clear language, consistent navigation, and error
                  assistance, we reduce confusion and make interfaces more
                  user-friendly.
                  <br />
                  <br />
                  👉 Remember:{" "}
                  <i>If a user can&apos;t understand it, they can&apos;t use it.</i>
                </p>
              </div>
            </div>
          ),
        },
        {
          title: "Robust",
          icon: <Lightbulb className="w-6 h-6 text-[#ED5E20]" />,
          content: (
            <div className="space-y-6 mx-auto">
              {/* Learning Goals */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Learning Goals
                  </h2>
                </div>
                By the end of this lesson, you will be able to:
                <br />
                <br />
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Explain what “Robust” means in accessibility and why it
                    matters in UX design.
                  </li>
                  <li>
                    Identify WCAG 2.1 success criteria under the Robust
                    principle.
                  </li>
                  <li>
                    Apply coding and design practices that ensure your interface
                    works well with assistive technologies across platforms.
                  </li>
                </ul>
              </div>

              {/* What Does Robust Mean */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    What Does “Robust” Mean?
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  For content to be robust, it must be{" "}
                  <strong>
                    reliable and compatible with different technologies
                  </strong>
                  , including current and future assistive tools (like screen
                  readers, voice navigation, or alternative input devices).
                  <br />
                  <br />
                  👉 In short:{" "}
                  <i>
                    If technology can&apos;t interpret your design, users relying on
                    that technology can&apos;t use it.
                  </i>
                </p>
              </div>

              {/* Compatible Content */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Keyboard className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    4.1 Compatible
                  </h2>
                </div>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                  <li>
                    <strong>4.1.1 Parsing</strong>
                    <br />
                    <br />
                    Code should be clean and valid so browsers and assistive
                    technologies can interpret it consistently.
                    <br />
                    <br />✅ Good example: Properly nested HTML tags (
                    <code>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</code>)
                    <br />❌ Bad example: Unclosed tags or duplicate IDs that
                    confuse assistive tools.
                    <br />
                    <br />
                  </li>
                  <li>
                    <strong>4.1.2 Name, Role, Value</strong>
                    <br />
                    <br />
                    All interactive UI components must expose their{" "}
                    <strong>name, role, and state</strong> to assistive
                    technologies.
                    <br />
                    <br />✅ Good example: A custom button should announce
                    itself as a “button” to screen readers and reflect its state
                    (pressed/unpressed).
                    <br />❌ Bad example: A clickable icon with no label or ARIA
                    attributes—users won&apos;t know what it does.
                    <br />
                    <br />
                  </li>
                  <li>
                    <strong>4.1.3 Status Messages</strong>
                    <br />
                    <br />
                    Important messages (like form errors, success alerts, or
                    loading updates) must be conveyed programmatically so
                    assistive tech can announce them.
                    <strong>name, role, and state</strong> to assistive
                    technologies.
                    <br />
                    <br />✅ Good example: Using aria-live to announce “Form
                    submitted successfully.”
                    <br />❌ Bad example: Only showing a visual change (green
                    checkmark) with no text or programmatic announcement.
                    <br />
                    <br />
                  </li>
                </ul>
              </div>

              {/* Quick Self-Check */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Quick Self-Check (Exercices)
                  </h2>
                </div>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    Run your design/code through an{" "}
                    <strong>HTML validator</strong>. Are there errors that could
                    break assistive tech?
                  </li>
                  <li>
                    Do your interactive elements (buttons, links, toggles) have
                    proper <strong>roles and labels</strong>?
                  </li>
                  <li>
                    If an error or success message appears, would a{" "}
                    <strong>screen reader announce it</strong>?
                  </li>
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-neutral-700 rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Summary
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  The Robust principle ensures that{" "}
                  <strong>
                    content works across devices, browsers, and assistive
                    technologies
                  </strong>
                  , now and in the future. Clean code, clear roles, and proper
                  status updates make interfaces more reliable and inclusive.
                  <br />
                  <br />
                  👉 Remember:{" "}
                  <i>
                    If assistive technology can&apos;t interpret your design, users
                    can&apos;t use it.
                  </i>
                </p>
              </div>

              {/* Image */}
              <Image
                src="https://miro.medium.com/v2/resize:fit:720/format:webp/1*QLaQWdVMux9F2qVWLtjOgg.jpeg"
                alt="WCAG Robust Principle"
                width={720}
                height={405}
                className="w-full rounded-xl shadow-md"
              />
            </div>
          ),
        },
      ].map((section) => (
        <div
          key={section.title}
          className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4"
        >
          <div className="flex items-center space-x-3">
            {section.icon}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {section.title}
            </h2>
          </div>
          {section.content}
        </div>
      ))}

      {/* Lesson Footer */}
      <div className="text-center space-y-2">
        <p className="text-gray-600 dark:text-gray-300">
          Congrats! You&apos;ve gone through the POUR principles. Apply these lessons
          in your next web project to make it accessible to everyone.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn more from the official{" "}
          <a
            href="https://www.w3.org/WAI/WCAG21/quickref/"
            target="_blank"
            className="hover:underline text-orange-300 hover:text-[#ED5E20]"
          >
            WCAG 2.1 Quick Reference
          </a>
          .
        </p>
      </div>
    </div>
  );
}
