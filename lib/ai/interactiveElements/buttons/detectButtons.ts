import { FigmaNode, RGBA } from "@/lib/declaration/figmaInfo";
import { DetectedButton } from "@/lib/declaration/componentAlias";
import { COMMON_BUTTON_NAMES } from "@/constants/commonLabels/commonButtonNames";

function normalizeLabel(label: string): string {
  return label.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

const COMMON_BUTTON_SET = new Set(COMMON_BUTTON_NAMES.map(n => n.toLowerCase()));

function hasIconDeep(node: FigmaNode): boolean {
  if (node.type === "VECTOR" || node.type === "ICON") return true;
  if (node.children) {
    return node.children.some(child => hasIconDeep(child));
  }
  return false;
}

function inferStyleVariant(node: FigmaNode, textNodes: FigmaNode[]): "solid" | "outline" | "text" | "icon" | "ghost" | undefined {
  const hasSolidFill = node.fills?.some(f => f.type === "SOLID" && f.color && f.color.a > 0.5);
  const hasStroke = node.strokes?.length && node.strokes.some(s => s.type === "SOLID" && s.color && s.color.a > 0.5);
  const isIconOnly = !textNodes.length && hasIconDeep(node);
  const isGhost = node.fills?.some(f => f.type === "SOLID" && f.color && f.color.a <= 0.5);

  if (isIconOnly) return "icon";
  if (hasSolidFill && hasStroke) return "solid";
  if (hasSolidFill) return "solid";
  if (hasStroke) return "outline";
  if (isGhost) return "ghost";
  if (!hasSolidFill && !hasStroke && textNodes.length) return "text";
  return undefined;
}


function findAllTextNodes(node: FigmaNode): FigmaNode[] {
  let result: FigmaNode[] = [];
  if (node.type === "TEXT" && !!node.characters?.trim()) {
    result.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      result = result.concat(findAllTextNodes(child));
    }
  }
  return result;
}

// Helper: Convert Figma RGBA (0-1) to sRGB luminance
function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const toLinear = (c: number) => {
    c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return c;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Calculate contrast ratio (WCAG)
function contrastRatio(bg: RGBA, fg: RGBA): number {
  const L1 = luminance(bg);
  const L2 = luminance(fg);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

export function detectButtonsInFrame(frame: FigmaNode): DetectedButton[] {
  const buttons: DetectedButton[] = [];
  const stack: FigmaNode[] = [frame];

  while (stack.length) {
    const node = stack.pop()!;
    if (!node) continue;

    const normalizedName = normalizeLabel(node.name);

    const hasButtonLikeName =
      normalizedName.includes("button") ||
      [...COMMON_BUTTON_SET].some(label => normalizedName.includes(label));

    const isComponentButton =
      node.component?.componentTypes === "Button";

    // Find all descendant text nodes (not just direct children)
    const textNodes = findAllTextNodes(node);

    // Heuristic: Shape/component with a single visible text node (even if nested) and solid fill
    const isShapeWithText =
      ["FRAME", "RECTANGLE", "COMPONENT", "INSTANCE"].includes(node.type) &&
      textNodes.length === 1 &&
      node.fills && node.fills.some(f => f.type === "SOLID" && f.color && f.color.a > 0.5);

    const isInteractive =
      node.accessibility?.role === "button" ||
      node.interaction?.isInteractive === true;

    if (
      (isShapeWithText || isComponentButton || isInteractive) ||
      (hasButtonLikeName && node.type !== "TEXT" && textNodes.length > 0)
    ) {
      if (node.type === "TEXT") continue;

      const label = textNodes[0]?.characters
        ? normalizeLabel(textNodes[0].characters)
        : normalizedName;

      // Get background and text color for contrast calculation
      const backgroundColor = node.fills?.find(f => f.type === "SOLID")?.color ?? null;
      const textColor = textNodes[0]?.fills?.find(f => f.type === "SOLID")?.color ?? null;

      let ratio: number | undefined = undefined;
      if (backgroundColor && textColor) {
        ratio = contrastRatio(backgroundColor, textColor);
      }

      const styleVariant = inferStyleVariant(node, textNodes);


      buttons.push({
        id: node.id,
        label,
        nodeType: node.type,
        nodeName: node.name,
        kind: "button",
        hasVisibleBoundary: !!(node.strokes?.length || node.effects?.length),
        backgroundColor,
        textColor,
        contrastRatio: ratio,
        styleVariant: styleVariant, // You can infer this from fills/strokes if needed
        hasIcon: hasIconDeep(node),
      });
    }

    if (node.children?.length) stack.push(...node.children);
  }

  return buttons;
}