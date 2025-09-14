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
  if (node.type === 'FRAME' && node.visible !== false) {
    const isReasonable =
      (!node.absoluteBoundingBox || (
        node.absoluteBoundingBox.width >= 100 &&
        node.absoluteBoundingBox.height >= 100
      )) &&
      !/icon|avatar|logo|button/i.test(node.name ?? "");

    if (isReasonable) {
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