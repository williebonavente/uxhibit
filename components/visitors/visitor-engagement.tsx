"use client";
import React, { useState } from "react";

const FEEDBACK_OPTIONS = [
  { emoji: "😍", label: "Inspiring!" },
  { emoji: "🤔", label: "Interesting" },
  { emoji: "🎨", label: "Love the colors!" },
  { emoji: "🧑‍💻", label: "Great usability" },
  { emoji: "😕", label: "Confusing" },
];

const INSPIRATION_TIPS = [
  "Try using more whitespace for clarity.",
  "Consider a bolder color palette!",
  "Typography can make or break a design.",
  "Accessibility is key—try simulating color blindness.",
  "Animations can add delight, but use them sparingly.",
  "Balance your layout for better visual flow.",
];

export default function VisitorEngagement({ designId }: { designId: string }) {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState("");

  function handleFeedback(option: string) {
    setSelectedFeedback(option);
    // TODO: Save feedback to DB (optional)
  }

  function handleInspireMe() {
    const randomTip = INSPIRATION_TIPS[Math.floor(Math.random() * INSPIRATION_TIPS.length)];
    setTip(randomTip);
    setShowTip(true);
  }

  return (
    <div className="mt-8 p-4 rounded-lg bg-orange-50 border border-orange-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-orange-700">What do you think?</h3>
      <div className="flex gap-3 mb-4">
        {FEEDBACK_OPTIONS.map(opt => (
          <button
            key={opt.emoji}
            className={`text-2xl px-3 py-2 rounded-full border transition ${
              selectedFeedback === opt.emoji
                ? "bg-orange-200 border-orange-400"
                : "bg-white border-gray-200 hover:bg-orange-100"
            }`}
            onClick={() => handleFeedback(opt.emoji)}
            disabled={!!selectedFeedback}
            aria-label={opt.label}
          >
            {opt.emoji}
          </button>
        ))}
      </div>
      {selectedFeedback && (
        <div className="text-green-700 mb-2">Thanks for your feedback!</div>
      )}

      <button
        className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
        onClick={handleInspireMe}
      >
        Inspire Me
      </button>
      {showTip && (
        <div className="mt-3 p-3 bg-white border-l-4 border-orange-400 text-orange-800 rounded shadow">
          <strong>Design Tip:</strong> {tip}
        </div>
      )}

      <div className="mt-6">
        <h4 className="font-semibold mb-1">Have a question for the designer?</h4>
        <input
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Ask your question..."
          // TODO: Implement Q&A submission
        />
        <button className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">
          Submit
        </button>
      </div>
    </div>
  );
}