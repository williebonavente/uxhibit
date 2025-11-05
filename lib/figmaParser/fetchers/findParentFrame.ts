import { FigmaNode } from "@/lib/declaration/figmaInfo";

export function findParentFrame(node: FigmaNode, targetId: string, parent: FigmaNode | null = null): FigmaNode | null {
  if (node.id === targetId) {
    if (parent && parent.type === "FRAME") return parent;
    return null;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findParentFrame(child, targetId, node.type === "FRAME" ? node : parent);
      if (found) return found;
    }
  }
  return null;
}

// SEE the diff here 