import { RGBA } from "@/lib/declaration/figmaInfo";
import * as wcag from "wcag-contrast"; // npm i wcag-contrast

/** Convert normalized Figma RGBA (0..1) → HEX string */
export function rgbaToHex(c: RGBA | undefined | null): string {
  if (!c) return "#FFFFFF"; // fallback to white
  const r = Math.round((c.r ?? 0) * 255);
  const g = Math.round((c.g ?? 0) * 255);
  const b = Math.round((c.b ?? 0) * 255);
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Get raw contrast ratio using wcag-contrast */
export function getContrastRatio(
  fg: RGBA | undefined | null,
  bg: RGBA | undefined | null
): number {
  try {
    const f = rgbaToHex(fg);
    const b = rgbaToHex(bg);
    const ratio = wcag.hex(f, b);
    return typeof ratio === "number" ? ratio : 0;
  } catch (err) {
    console.error("Contrast calc failed:", err);
    return 0;
  }
}

/** Get WCAG compliance (AA / AAA / Fail) */
export function getContrastCompliance(
  ratio: number,
  fontSize: number = 16,
  isBold: boolean = false
): { AA: boolean; AAA: boolean; level: "AAA" | "AA" | "Fail" } {
  const largeText = fontSize >= 18 || (fontSize >= 14 && isBold);

  // WCAG thresholds
  const AA = largeText ? ratio >= 3 : ratio >= 4.5;
  const AAA = largeText ? ratio >= 4.5 : ratio >= 7;

  return {
    AA,
    AAA,
    level: AAA ? "AAA" : AA ? "AA" : "Fail",
  };
}

/** Map ratio into score buckets (0–100) */
export function getContrastScoreFromRatio(ratio: number): number {
  if (ratio >= 7) return 100; // AAA
  if (ratio >= 4.5) return 90; // AA (normal text)
  if (ratio >= 3) return 70;   // large text only
  if (ratio >= 1.5) return 50; // poor but semi-readable
  return 0;
}
