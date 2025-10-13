const defaultThemeKeywords = [
  "home", "dashboard", "profile", "settings", "login", "register", "about", "contact", "feed", "explore"
];
type FigmaNode = {
  id: string;
  name?: string;
  type: string;
  visible?: boolean;
  absoluteBoundingBox?: { width: number; height: number };
  children?: FigmaNode[];
};
export const THEME_KEYWORDS = new Set<string>(defaultThemeKeywords);

export function addThemeKeyword(keyword: string) {
  THEME_KEYWORDS.add(keyword.toLowerCase());
}

export function removeThemeKeyword(keyword: string) {
  THEME_KEYWORDS.delete(keyword.toLowerCase());
}

export function isThemeRelevant(name: string | undefined) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return Array.from(THEME_KEYWORDS).some(keyword => lower.includes(keyword));
}

export function collectReasonableFrameIds(
  node: FigmaNode,
  ids: string[] = [],
  themedIds: string[] = []
) {
  // Generalized helper to check if a node or its descendants contain a given type
  function hasNodeType(n: FigmaNode, types: string[]): boolean {
    if (types.includes(n.type)) return true;
    if (n.children) return n.children.some(child => hasNodeType(child, types));
    return false;
  }

  // Example: Only include frames with at least one TEXT or SHAPE node
  const detectTypes = ["TEXT"]; // Add more types if needed, e.g., "SHAPE", "VECTOR"

  if (node.type === 'FRAME' && node.visible !== false) {
    const isReasonable =
      (!node.absoluteBoundingBox || (
        node.absoluteBoundingBox.width >= 100 &&
        node.absoluteBoundingBox.height >= 100
      )) &&
      !/icon|avatar|logo|button|text/i.test(node.name ?? "");

    // Only include if the frame has at least one node of the desired type(s)
    if (isReasonable && hasNodeType(node, detectTypes)) {
      ids.push(node.id);
      if (isThemeRelevant(node.name)) {
        themedIds.push(node.id);
      }
    }
  }
  if (node.type === 'CANVAS' && Array.isArray(node.children)) {
    node.children.forEach((child: FigmaNode) => collectReasonableFrameIds(child, ids, themedIds));
  }
  return { ids, themedIds };
}