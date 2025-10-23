import { FigmaNode } from "@/lib/declaration/figmaInfo";
import { findParentFrame } from "@/lib/figmaParser/fetchers/findParentFrame";

/**
 * Finds the parent frame for a given nodeId across multiple pages.
 * Returns the frame node or null if not found.
 */
export function findParentFrameInPages(pages: FigmaNode[], nodeId: string): FigmaNode | null {
    for (const page of pages) {
        const parentFrame = findParentFrame(page, nodeId);
        if (parentFrame) return parentFrame;
    }
    return null;
}