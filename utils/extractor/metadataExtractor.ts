import {
  FigmaNode,
  TextNode,
  RGBA,
  FrameNode,
  ShapeNode,
  FigmaNodesResponse,
  NormalizedDocument
} from "@/lib/declaration/figmaInfo";

export function extractColor(node: FigmaNode): RGBA | null {
  // For text/shapes: prefer fills
  if (node.fills && node.fills.length > 0) {
    const solid = node.fills.find(f => f.type === "SOLID");
    if (solid && solid.color) return solid.color as RGBA;
  }
  // Some nodes have backgroundColor
  if ("backgroundColor" in node && node.backgroundColor) {
    return node.backgroundColor as RGBA;
  }
  // For frames: prefer background paints
  if (node.background && node.background.length > 0) {
    const solid = node.background.find(b => b.type === "SOLID");
    if (solid && solid.color) return solid.color as RGBA;
  }

  return null;
}

export function extractTextNode(node: FigmaNode): TextNode | null {
  if (node.type !== "TEXT" || !node.characters || !node.style) return null;

  return {
    id: node.id,
    fontFamily: node.style.fontFamily ?? "Unknown",
    text: node.characters,
    fontSize: node.style.fontSize ?? 0,
    fontWeight: node.style.fontWeight ?? 400,
    color: extractColor(node)!,
    boundingBox: node.absoluteBoundingBox!,
  };
}

export function extractFrame(node: FigmaNode): FrameNode | null {
  if (node.type !== "FRAME" || !node.absoluteBoundingBox) return null;

  // Recursively extract all text nodes and shapes
  const children: (TextNode | ShapeNode)[] = [];

  function traverse(child: FigmaNode) {
    if (child.type === "TEXT") {
      const textNode = extractTextNode(child);
      if (textNode) children.push(textNode);
    }
    if (["RECTANGLE", "ELLIPSE"].includes(child.type)) {
      children.push({
        id: child.id,
        type: child.type as "RECTANGLE" | "ELLIPSE",
        color: extractColor(child)!,
        boundingBox: child.absoluteBoundingBox!,
      });
    }
    if (child.children) {
      child.children.forEach(traverse);
    }
  }

  if (node.children) node.children.forEach(traverse);

  return {
    id: node.id,
    name: node.name,
    boundingBox: node.absoluteBoundingBox,
    backgroundColor: extractColor(node),
    children,
  };
}

export function normalizeDocument(raw: FigmaNodesResponse): NormalizedDocument {
  const frames: FrameNode[] = [];
  Object.values(raw.nodes).forEach(nodeWrapper => {
    const frame = extractFrame(nodeWrapper.document);
    if (frame) frames.push(frame);
  });

  return { frames };
}

export function extractTextNodes(root: FigmaNode): TextNode[] {
  const results: TextNode[] = [];
  function traverse(node: FigmaNode) {
    // console.log("Traversing node:", node.type, node.name || node.id);
    if (node.type === "TEXT" && node.characters) {
      results.push({
        id: node.id,
        text: node.characters,
        fontSize: node.style?.fontSize ?? 0,
        fontWeight: node.style?.fontWeight ?? 400,
        fontFamily: node.style?.fontFamily ?? "Unknown",
        color: extractColor(node) ?? { r: 0, g: 0, b: 0, a: 1 },
        boundingBox: node.absoluteBoundingBox ?? null,
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  traverse(root);
  return results;
}

export function getFrameTextNodes(frameMetadata: Record<string, any>): Record<string, TextNode[]> {
  const result: Record<string, TextNode[]> = {};

  Object.entries(frameMetadata).forEach(([frameId, nodeWrapper]) => {
    const frameDoc = nodeWrapper.document;
    if (frameDoc.type === "FRAME") {
      result[frameId] = extractTextNodes(frameDoc);
    }
  });

  return result;
}

export function getEffectiveBackgroundColor(
  text: TextNode,
  siblings: (TextNode | ShapeNode)[],
  frameBg: RGBA
): RGBA {
  if (!text.boundingBox) return frameBg;

  const { x, y, width, height } = text.boundingBox;
  const textCenter = { cx: x + width / 2, cy: y + height / 2 };

  for (let i = siblings.length - 1; i >= 0; i--) {
    const node = siblings[i];
    if ("type" in node && (node.type === "RECTANGLE" || node.type === "ELLIPSE")) {
      const bb = node.boundingBox;
      if (!bb) continue;

      // Simple hit-test: text center inside shape bounding box
      const inside =
        textCenter.cx >= bb.x &&
        textCenter.cx <= bb.x + bb.width &&
        textCenter.cy >= bb.y &&
        textCenter.cy <= bb.y + bb.height;

      if (inside && node.color) {
        return node.color; // first covering shape found (topmost)
      }
    }
  }

  return frameBg;
}