import { FrameTextMap, FrameScoreResult, TextNodeDetail, InteractiveNodeDetail } from "../declaration/scoringTypes";
import { getContrastRatio, getContrastScoreFromRatio } from "@/utils/contrastChecker/contrastUtils";
import { RGBA } from "@/lib/declaration/figmaInfo";

/**
 * Score a frame given its text nodes and raw frame info
 * We compute:
 * - color: avg contrast score (0-100)
 * - typography: % of text >= 16px mapping to score
 * - usability: % of interactive nodes >= 44px mapping to score
 * - layout: alignment consistency heuristic mapping to score
 * - hierarchy: diversity of fontSizes mapping to score
 * - overall: weighted average
 */
export function evaluateFrameScores(frameMap: FrameTextMap): FrameScoreResult[] {
    const results: FrameScoreResult[] = [];
    Object.values(frameMap).forEach(frame => {
        const bg: RGBA | null = frame.backgroundColor ?? { r: 1, g: 1, b: 1, a: 1 };
        const textDetails: TextNodeDetail[] = frame.textNodes.map(t => {
            const ratio = getContrastRatio(t.color ?? { r: 0, g: 0, b: 0, a: 1 }, bg);
            return {
                ...t,
                contrastRatio: Number(ratio.toFixed(2)),
                contrastScore: getContrastScoreFromRatio(ratio)
            };
        });

        // Color score: average of contrastScore
        const colorScore = textDetails.length
            ? Math.round(textDetails.reduce((s, t) => s + (t.contrastScore ?? 0), 0) / textDetails.length)
            : 100; // no text -> nothing to penalize

        // Typography score: percent of text nodes >= 16px
        const typographyPassCount = textDetails.filter(t => (t.fontSize ?? 0) >= 16).length;
        const typographyPct = textDetails.length ? (typographyPassCount / textDetails.length) : 1;
        const typographyScore = Math.round(typographyPct * 100);

        // Usability: check interactive shapes/buttons in raw frame (boundingBox sizes)
        const interactive: InteractiveNodeDetail[] = [];
        const rawChildren = (frame.rawFrameNode?.children ?? []) as any[];
        rawChildren.forEach((c: any) => {
            if (["RECTANGLE", "ELLIPSE", "FRAME", "COMPONENT", "INSTANCE", "VECTOR"].includes(c.type)) {
                interactive.push({
                    id: c.id,
                    boundingBox: c.absoluteBoundingBox ?? null,
                    type: c.type,
                    size: c.absoluteBoundingBox ? { width: c.absoluteBoundingBox.width, height: c.absoluteBoundingBox.height } : null
                });
            }
        });

        const interactiveCount = interactive.length;
        const interactivePassCount = interactive.filter(n => (n.size?.width ?? 0) >= 44 && (n.size?.height ?? 0) >= 44).length;
        const usabilityPct = interactiveCount ? (interactivePassCount / interactiveCount) : 1;
        const usabilityScore = Math.round(usabilityPct * 100);

        // Layout: alignment consistency heuristic (x positions of text nodes)
        const xs = textDetails.map(t => t.boundingBox?.x ?? 0);
        let layoutScore = 100;
        if (xs.length >= 2) {
            // Find most common x (rounded to 8px grid) and compute percent matching
            const buckets: Record<number, number> = {};
            xs.forEach(x => {
                const key = Math.round((x ?? 0) / 8) * 8;
                buckets[key] = (buckets[key] ?? 0) + 1;
            });
            const topCount = Math.max(...Object.values(buckets));
            const layoutPct = topCount / xs.length;
            layoutScore = Math.round(layoutPct * 100);
        }

        // Hierarchy: detect distinct font sizes and relative scale
        const sizes = Array.from(new Set(textDetails.map(t => t.fontSize ?? 0))).filter(Boolean).sort((a, b) => a - b);
        let hierarchyScore = 50;
        if (sizes.length === 0) hierarchyScore = 100; // no text -> neutral
        else if (sizes.length === 1) hierarchyScore = 40;
        else {
            // measure spread: if largest significantly larger than median -> good hierarchy
            const max = sizes[sizes.length - 1];
            const median = sizes[Math.floor(sizes.length / 2)];
            const ratio = median === 0 ? 1 : max / median;
            hierarchyScore = Math.min(100, Math.round(Math.min(3, ratio) / 3 * 100)); // scale 0..3 -> 0..100
            hierarchyScore = Math.max(hierarchyScore, 50); // minimum baseline
        }

        // Overall weighted average
        const weights = { color: 0.30, typography: 0.20, usability: 0.20, layout: 0.15, hierarchy: 0.15 };
        const overall = Math.round(
            colorScore * weights.color +
            typographyScore * weights.typography +
            usabilityScore * weights.usability +
            layoutScore * weights.layout +
            hierarchyScore * weights.hierarchy
        );

        results.push({
            frameId: frame.frameId,
            frameName: frame.frameName,
            scores: {
                color: colorScore,
                typography: typographyScore,
                usability: usabilityScore,
                layout: layoutScore,
                hierarchy: hierarchyScore,
                overall
            },
            justification: {
                color: `Avg contrast score ${colorScore} (per-text contrast used)`,
                typography: `${typographyPassCount}/${textDetails.length} text nodes >=16px`,
                usability: `${interactivePassCount}/${interactiveCount} interactive elements >=44px`,
                layout: `Alignment consistency ${layoutScore}%`,
                hierarchy: `Detected ${sizes.length} distinct font sizes`
            },
            textDetails,
            interactiveDetails: interactive
        });
    });

    return results;
}
