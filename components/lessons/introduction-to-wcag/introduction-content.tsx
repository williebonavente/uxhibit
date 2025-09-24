import { Globe, Book, Eye, Lightbulb, Image, Keyboard } from "lucide-react";

export default function WcagContent() {
  return (
    <div className="mt-5 space-y-5">
      
      {/* Header */}
      <div className="space-y-2 w-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white w-full">
          WCAG 2.1 Accessibility: Understanding the POUR Principles
        </h1>
        <p className="text-gray-600 dark:text-gray-300 w-full">
          Welcome! WCAG 2.1 is a global standard ensuring websites are usable by everyone, including people with visual, hearing, motor, or cognitive disabilities. In this lesson, we’ll break down its core principles: Perceivable, Operable, Understandable, and Robust.
        </p>
      </div>

      {/* What is WCAG Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">What Is WCAG?</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          WCAG 2.1 (Web Content Accessibility Guidelines) is created by the W3C to make digital content accessible to all users. It benefits those with:
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Visual impairments (blindness, low vision)</li>
          <li>Hearing loss</li>
          <li>Motor disabilities</li>
          <li>Cognitive and learning challenges</li>
        </ul>
      </div>

      {/* POUR Principles Overview Card */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Book className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">POUR Principles Overview</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          POUR is the backbone of WCAG. Each principle ensures your website is accessible and user-friendly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
          {[
            { title: "Perceivable", desc: "Make content detectable by sight, sound, or touch.", icon: <Eye className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Operable", desc: "Users can interact with your interface through various inputs.", icon: <Keyboard className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Understandable", desc: "Content should be clear, predictable, and easy to follow.", icon: <Book className="w-10 h-10 text-[#ED5E20]" /> },
            { title: "Robust", desc: "Ensure compatibility across devices, browsers, and assistive technologies.", icon: <Lightbulb className="w-10 h-10 text-[#ED5E20]" /> },
          ].map((principle) => (
            <div key={principle.title} className="flex items-center space-x-5 p-5 bg-gray-50 dark:bg-neutral-700 rounded-lg shadow-sm hover:shadow-md transition">
              {principle.icon}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{principle.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{principle.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus on Perceivable */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Focus on “Perceivable”</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          Perceivable content ensures users can access information through sight, sound, or touch. Key techniques include:
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li><strong>Text Alternatives:</strong> Alt text for images and icons</li>
          <li><strong>Time-Based Media:</strong> Captions and transcripts for audio/video</li>
          <li><strong>Adaptable:</strong> Semantic structure for screen readers</li>
          <li><strong>Distinguishable:</strong> Color contrast and text resizing</li>
        </ul>
        <div className="bg-[#ED5E20]/25 dark:bg-[#ED5E20]/50 p-3 rounded-lg border-l-4 border-[#ED5E20] dark:border-[#ED5E20]">
          <strong>Tip:</strong> Always consider users with limitations. Ask: "Can everyone access this content easily?"
        </div>
      </div>

      {/* Why It Matters */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Why It Matters</h2>
        </div>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
          <li>Older adults with age-related impairments</li>
          <li>Users in noisy environments</li>
          <li>Mobile users with limited bandwidth or small screens</li>
        </ul>
      </div>

      {/* Visual Overview */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center space-x-3">
          <Image className="w-6 h-6 text-[#ED5E20]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Visual Overview</h2>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-7">
          The POUR principles can be visualized to better understand how they interact to make websites accessible. Each principle—Perceivable, Operable, Understandable, and Robust—addresses a different aspect of accessibility, but together they ensure that digital content can be used effectively by everyone.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-7">
          Perceivable content ensures information is available to the senses, Operable focuses on how users can interact with it, Understandable guarantees clarity and predictability, and Robust ensures the content works across devices, browsers, and assistive technologies. This visual representation helps learners quickly grasp the overall structure of WCAG 2.1 guidelines.
        </p>
        <img
          src="https://www.webyes.com/wp-content/uploads/2024/11/wcag-pour-accessibility-1-1024x576.jpg"
          alt="WCAG POUR Principles Diagram"
          className="w-full rounded-lg shadow-md"
        />
        <div className="bg-[#ED5E20]/25 dark:bg-[#ED5E20]/50 p-3 rounded-lg border-l-4 border-[#ED5E20] dark:border-[#ED5E20]">
          <strong>Tip:</strong> Use this diagram as a mental map to connect each principle to real-world design practices.
        </div>
      </div>

      {/* Lesson Footer */}
      <div className="text-center space-y-2">
        <p className="text-gray-600 dark:text-gray-300">
          🎉 Congrats! You now understand the POUR principles. Apply them to make your web projects accessible to everyone.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn more from the official <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" className="underline text-[#ED5E20]">WCAG 2.1 Quick Reference</a>.
        </p>
      </div>

    </div>
  );
}
