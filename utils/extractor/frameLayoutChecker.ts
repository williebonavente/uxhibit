import { FrameNode, ShapeNode, TextNode } from "@/lib/declaration/figmaInfo";
import { LayoutCheckResult, LayoutIssue } from "@/lib/declaration/figmaLayout";

function checkWCAGLayout(frame: FrameNode): LayoutIssue[] {
    const issues: LayoutIssue[] = [];
    const textNodes = frame.children.filter(n => "text" in n) as TextNode[];

    // WCAG 1.4.12: Text Spacing
    const spacingIssue = checkConsistentSpacing(textNodes);
    if (spacingIssue) {
        issues.push({
            ...spacingIssue,
            id: "wcag-spacing",
            message: `WCAG 1.4.12: Vertical spacing between text nodes varies from ${spacingIssue.details?.min}px to ${spacingIssue.details?.max}px.`,
            suggestion: "Set consistent spacing, e.g., 16px between paragraphs."
        });
    }

    // WCAG 1.4.8: Alignment
    const alignmentIssue = checkAlignment(textNodes, frame);
    if (alignmentIssue) {
        issues.push({
            ...alignmentIssue,
            id: "wcag-alignment",
            message: `WCAG 1.4.8: Text nodes are misaligned by up to ${alignmentIssue.details?.delta}px.`,
            suggestion: "Align all text nodes to the same left edge."
        });
    }

    // WCAG 1.4.12/1.4.8: Overlap
    const overlapIssues = checkOverlap(frame.children);
    // Inside checkWCAGLayout
    if (overlapIssues.length > 0) {
        const nodesInvolved = overlapIssues.map(i => i.message).join("; ");
        issues.push({
            id: "wcag-overlap",
            severity: "high",
            message: `WCAG 1.4.12/1.4.8: Overlap detected. Examples: ${nodesInvolved}`,
            suggestion: "Reposition overlapping elements to ensure readability.",
            confidence: 0.9, // Add this
            wcagReference: "WCAG 1.4.12 / 1.4.8" // Add this
        });
    }

    // WCAG 1.4.8: Margins
    const marginIssue = checkMargins(frame, 16);
    if (marginIssue) {
        issues.push({
            ...marginIssue,
            id: "wcag-margins",
            message: `WCAG 1.4.8: Margins from frame edge are less than 16px for some nodes.`,
            suggestion: "Increase margins to at least 16px for better readability."
        });
    }

    return issues;
}

function checkAlignment(textNodes: TextNode[], frame?: FrameNode): LayoutIssue | null {
    if (frame?.skipAlignmentCheck) return null; // Subjective override

    if (textNodes.length > 1) {
        const lefts = textNodes.map(t => t.boundingBox?.x ?? 0);
        const minLeft = Math.min(...lefts);
        const maxLeft = Math.max(...lefts);

        // Subjective: If all text is center-aligned, don't penalize
        const allCentered = textNodes.every(t => Math.abs((t.boundingBox?.x ?? 0) + (t.boundingBox?.width ?? 0) / 2 - frame.boundingBox.x + frame.boundingBox.width / 2) < 8);
        if (allCentered) return null;

        if (maxLeft - minLeft > 16) {
            return {
                id: "alignment",
                severity: "medium",
                message: "Text nodes are not left-aligned.",
                suggestion: "Align text nodes to the same x position.",
                details: { delta: maxLeft - minLeft }, // <-- Add details here
                confidence: 0.6, // heuristic value
                wcagReference: "WCAG 1.4.8" // reference for alignment
            };
        }
    }
    return null;
}

function checkConsistentSpacing(textNodes: TextNode[]): LayoutIssue | null {
    if (textNodes.length < 2) return null;
    const sorted = [...textNodes].sort((a, b) => (a.boundingBox?.y ?? 0) - (b.boundingBox?.y ?? 0));
    const spacings = [];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].boundingBox;
        const curr = sorted[i].boundingBox;
        if (prev && curr) {
            spacings.push(curr.y - (prev.y + prev.height));
        }
    }
    const min = Math.min(...spacings);
    const max = Math.max(...spacings);
    if (max - min > 16) {
        return {
            id: "spacing",
            severity: "medium",
            message: "Vertical spacing between text nodes is inconsistent.",
            suggestion: "Use consistent vertical spacing between elements.",
            details: { min, max, delta: max - min },
            confidence: 0.6, // heuristic value
            wcagReference: "WCAG 1.4.12" // reference for spacing
        };
    }
    return null;
}

function checkGridAlignment(textNodes: TextNode[], gridStep: number = 8): LayoutIssue | null {
    if (textNodes.length < 2) return null;
    const misaligned = textNodes.filter(t => {
        const x = t.boundingBox?.x ?? 0;
        const y = t.boundingBox?.y ?? 0;
        return x % gridStep > 2 || y % gridStep > 2; // allow small deviations
    });
    if (misaligned.length > 0) {
        return {
            id: "grid-alignment",
            severity: "medium",
            message: `Some text nodes are not aligned to the grid (step: ${gridStep}px).`,
            suggestion: `Align text nodes to a ${gridStep}px grid.`,
            confidence: 0.5, // heuristic value
            wcagReference: "WCAG 1.4.8" // reference for grid alignment
        };
    }
    return null;
}
function checkOverlap(nodes: Array<TextNode | ShapeNode>): LayoutIssue[] {
    const issues: LayoutIssue[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i].boundingBox;
            const b = nodes[j].boundingBox;
            if (a && b) {
                const overlap =
                    a.x < b.x + b.width &&
                    a.x + a.width > b.x &&
                    a.y < b.y + b.height &&
                    a.y + a.height > b.y;
                if (overlap) {
                    issues.push({
                        id: `overlap-${i}-${j}`,
                        severity: "high",
                        message: `Nodes ${i} and ${j} are overlapping.`,
                        suggestion: "Adjust positions to avoid overlap.",
                        confidence: 0.95, // Add this
                        wcagReference: "WCAG 1.4.12 / 1.4.8" // Add this
                    });
                }
            }
        }
    }
    return issues;
}

function checkMargins(frame: FrameNode, marginThreshold: number = 16): LayoutIssue | null {
    const { boundingBox } = frame;
    if (!boundingBox) return null;
    const textNodes = frame.children.filter(n => "text" in n) as TextNode[];
    const violations = textNodes.filter(t => {
        const bb = t.boundingBox;
        if (!bb) return false;
        return (
            bb.x - boundingBox.x < marginThreshold ||
            bb.y - boundingBox.y < marginThreshold ||
            boundingBox.x + boundingBox.width - (bb.x + bb.width) < marginThreshold ||
            boundingBox.y + boundingBox.height - (bb.y + bb.height) < marginThreshold
        );
    });
    if (violations.length > 0) {
        return {
            id: "margins",
            severity: "medium",
            message: `Some text nodes have insufficient margins from frame edges (threshold: ${marginThreshold}px).`,
            suggestion: `Ensure at least ${marginThreshold}px margin around content.`,
            confidence: 0.5, // heuristic value
            wcagReference: "WCAG 1.4.8" // reference for margins
        };
    }
    return null;
}

function checkVisualHierarchy(textNodes: TextNode[]): LayoutIssue | null {
    if (textNodes.length < 2) return null;
    // Check for at least two font sizes (e.g., heading vs body)
    const fontSizes = Array.from(new Set(textNodes.map(t => t.fontSize)));
    if (fontSizes.length < 2) {
        return {
            id: "hierarchy",
            severity: "low",
            message: "No clear visual hierarchy (all text is similar size).",
            suggestion: "Use larger font size for headings and smaller for body text.",
            confidence: 0.4, // heuristic value
            wcagReference: "" // no direct WCAG reference, leave empty or undefined
        };
    }
    return null;
}

export function checkLayout(frame: FrameNode): LayoutCheckResult {
    const issues: LayoutIssue[] = [];
    const textNodes = frame.children.filter(n => "text" in n) as TextNode[];

    // Alignment heuristic
    if (!frame.skipAlignmentCheck) {
        const alignmentIssue = checkAlignment(textNodes, frame);
        if (alignmentIssue) {
            issues.push({
                ...alignmentIssue,
                confidence: 0.6,
                overrideable: true
            });
        }
    }

    // Spacing heuristic
    const spacingIssue = checkConsistentSpacing(textNodes);
    if (spacingIssue) {
        issues.push({
            ...spacingIssue,
            confidence: 0.6,
            overrideable: true
        });
    }

    // Grid alignment heuristic
    const gridIssue = checkGridAlignment(textNodes);
    if (gridIssue) {
        issues.push({
            ...gridIssue,
            confidence: 0.5,
            overrideable: true
        });
    }

    // Margins heuristic
    const marginIssue = checkMargins(frame);
    if (marginIssue) {
        issues.push({
            ...marginIssue,
            confidence: 0.5,
            overrideable: true
        });
    }

    // Visual hierarchy heuristic
    const hierarchyIssue = checkVisualHierarchy(textNodes);
    if (hierarchyIssue) {
        issues.push({
            ...hierarchyIssue,
            confidence: 0.4,
            overrideable: true
        });
    }

    // Overlap — this is NOT heuristic (hard fail)
    const overlapIssues = checkOverlap(frame.children);
    if (overlapIssues.length > 0) {
        overlapIssues.forEach(iss => {
            issues.push({
                ...iss,
                confidence: 0.95,
                overrideable: false,
                wcagReference: "WCAG 1.4.12 / 1.4.8"
            });
        });
    }

    // WCAG layout checks (spacing, alignment, margins)
    const wcagIssues = checkWCAGLayout(frame);
    wcagIssues.forEach(iss => {
        issues.push({
            ...iss,
            confidence: 0.9,
            overrideable: false,
            wcagReference: iss.id.includes("wcag") ? iss.id : undefined
        });
    });

    const rawScore = computeLayoutConfidenceScore(issues);
    const score = Math.round(100 - rawScore * 100);

    return {
        score,
        issues,
        summary: issues.length === 0
            ? "Layout is well-structured. No issues detected."
            : `Review flagged layout issues for accessibility and usability improvements. (${issues.length} issue${issues.length > 1 ? "s" : ""} found)`
    };
}

function computeLayoutConfidenceScore(issues: LayoutIssue[]): number {
    if (issues.length === 0) return 1.0; // perfect confidence

    let totalWeight = 0;
    const totalIssues = issues.length;

    for (const issue of issues) {
        let weight = issue.confidence;
        if (issue.severity === "high") weight *= 1.0;
        else if (issue.severity === "medium") weight *= 0.6;
        else if (issue.severity === "low") weight *= 0.3;
        totalWeight += weight;
    }

    const normalized = 1 - (totalWeight / (totalIssues * 1.0));
    return Number(normalized.toFixed(3));
}