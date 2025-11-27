"use client";

import React from "react";

type SnapshotLike = { age?: string; occupation?: string } | null | undefined;

type ReadingItem = {
  title: string;
  url: string;
  why: string;
  badge?: string;
};

export function useReadingsForAudience(snapshot: SnapshotLike) {
  const a = snapshot?.age || "Millennial";
  const o = snapshot?.occupation || "Designer";

  return React.useMemo<ReadingItem[]>(() => {
    const base: ReadingItem[] = [
      {
        title: "Nielsen’s 10 Heuristics, remixed for modern product teams",
        url: "https://www.nngroup.com/articles/ten-usability-heuristics/",
        why: "Ground your UI with timeless principles that scale from MVPs to mature products.",
        badge: "Foundational",
      },
      {
        title: "Inclusive Components: Practical Accessibility Patterns",
        url: "https://inclusive-components.design/",
        why: "Turn tricky UI into accessible components without killing the vibe.",
        badge: "Accessibility",
      },
      {
        title: "Color & Contrast for Cognitive Ease",
        url: "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
        why: "Boost legibility and reduce visual strain for longer sessions.",
        badge: "Visual Design",
      },
      {
        title: "Information Hierarchy That Converts",
        url: "https://www.smashingmagazine.com/2017/05/bright-ideas-content-hierarchy/",
        why: "Structure your content so users find signal faster than noise.",
        badge: "Hierarchy",
      },
    ];

    const tailored: ReadingItem[] = [];

    if (/alpha|gen\s*alpha/i.test(a)) {
      tailored.push({
        title: "Designing for Gen Alpha: Short loops, vivid feedback",
        url: "https://www.nngroup.com/articles/younger-users/",
        why: "Favor instant feedback, forgiving flows, and crisp visuals for rapid comprehension.",
        badge: "Audience",
      });
    } else if (/gen\s*z|(^|\s)z($|\s)/i.test(a)) {
      tailored.push({
        title: "Micro-Interactions for Fast Scanners",
        url: "https://www.smashingmagazine.com/2022/03/microinteractions-guide/",
        why: "Reward quick actions; keep gestures and animations snappy.",
        badge: "Motion",
      });
    } else if (/millennial/i.test(a)) {
      tailored.push({
        title: "Trust Signals & Onboarding That Respect Time",
        url: "https://www.intercom.com/blog/customer-onboarding/",
        why: "Millennials value clarity and speed—optimize first-run experiences.",
        badge: "Onboarding",
      });
    }

    if (/freelancer|indie|contract/i.test(o)) {
      tailored.push({
        title: "Designing Dashboards for Solo Operators",
        url: "https://uxdesign.cc/dashboards-that-work-5e2f4e0",
        why: "Surface high-value metrics and reduce admin friction.",
        badge: "Dashboard",
      });
    } else if (/pm|product/i.test(o)) {
      tailored.push({
        title: "Decision-Ready UX: Less clutter, more clarity",
        url: "https://www.nngroup.com/articles/ux-metrics/",
        why: "Prioritize signals, contextual summaries, and drill-down paths.",
        badge: "Strategy",
      });
    } else if (/developer|engineer/i.test(o)) {
      tailored.push({
        title: "Information Density Without Overload",
        url: "https://alistapart.com/article/meaningful-ux/",
        why: "Use progressive disclosure; keep shortcuts discoverable.",
        badge: "IA",
      });
    }

    const seen = new Set<string>();
    return [...base, ...tailored].filter((i) => {
      const key = `${i.title}-${i.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [a, o]);
}

export function ReadingsPanel({ snapshot }: { snapshot: SnapshotLike }) {
  const readings = useReadingsForAudience(snapshot);
  const age = snapshot?.age || "Millennial";
  const occupation = snapshot?.occupation || "Design";

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="mb-2">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Curated UX readings tailored to{" "}
          <span className="font-semibold">{age}</span> in{" "}
          <span className="font-semibold">{occupation}</span>. Short, high-signal, and immediately useful.
        </div>
      </div>

      <div className="space-y-2">
        {readings.map((r, i) => (
          <a
            key={`${r.title}-${i}`}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="block group rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 bg-white/70 dark:bg-neutral-900/50 hover:bg-orange-50/60 dark:hover:bg-neutral-800/60 transition"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {r.title}
              </h4>
              {r.badge && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-300">
                  {r.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{r.why}</p>
          </a>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
        Tip: Save the most relevant links into your team’s Notion/Confluence with a brief reflection on how it applies to this design. Reflection `{'>'}`  bookmarking.
      </div>
    </div>
  );
}