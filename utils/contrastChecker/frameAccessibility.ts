import { getContrastRatio } from "@/utils/contrastChecker/contrastUtils";
import { normalizeDocument, getEffectiveBackgroundColor } from "@/utils/extractor/metadataExtractor";
import { FigmaNodesResponse, TextNode, FrameNode } from "@/lib/declaration/figmaInfo";

function mapContrastToScoreAndLevel(ratio: number, fontSize: number): { score: number; level: string } {
  const isLargeText = fontSize >= 18 || fontSize >= 14; // assuming bold weight is handled if available

  if (ratio >= 7) {
    return { score: 100, level: "AAA" };
  }
  if (ratio >= 4.5) {
    return { score: 90, level: "AA" };
  }
  if (ratio >= 3 && isLargeText) {
    return { score: 70, level: "AA Large Text" };
  }
  if (ratio >= 1.5) {
    return { score: 50, level: "Low Contrast" };
  }
  return { score: 0, level: "Fail" };
}

export function evaluateFrameAccessibility(raw: FigmaNodesResponse) {
  const normalized = normalizeDocument(raw);

  return normalized.frames.map((frame: FrameNode) => {
    // const bgColor: RGBA = frame.backgroundColor ?? { r: 1, g: 1, b: 1, a: 1 };

    const textNodes: TextNode[] = frame.children.filter(
      (c): c is TextNode => "text" in c
    );

    const scoredTexts = textNodes.map(text => {
      const fg = text.color && typeof text.color.r === "number" && typeof text.color.g === "number" && typeof text.color.b === "number"
        ? text.color
        : { r: 0, g: 0, b: 0, a: 1 }; // default to black

      // Resolve background: nearest covering shape or fallback to frame bg
      const bg = getEffectiveBackgroundColor(
        text,
        frame.children,
        frame.backgroundColor ?? { r: 1, g: 1, b: 1, a: 1 }
      );

      const ratio = getContrastRatio(fg, bg);
      // console.log(ratio);
      const { score, level } = mapContrastToScoreAndLevel(ratio, text.fontSize);

      return {
        ...text,
        contrastRatio: Number(ratio.toFixed(2)),
        contrastScore: score,
        wcagLevel: level,
      };
    });

    const avgContrast =
      scoredTexts.length > 0
        ? scoredTexts.reduce((sum, t) => sum + t.contrastScore, 0) / scoredTexts.length
        : 0;

    return {
      frameId: frame.id,
      frameName: frame.name,
      averageContrastScore: Math.round(avgContrast),
      textNodes: scoredTexts,
    };
  });
}
