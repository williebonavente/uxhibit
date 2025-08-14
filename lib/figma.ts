export function parseFigmaUrl(input: string): { fileKey: string; nodeId?: string; name?: string } | null {
  try {
    const url = new URL(input.trim());
    if (!/figma\.com$/.test(url.hostname)) return null;

    // Support /file, /design, /proto
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => ["file", "design", "proto"].includes(p));
    if (idx === -1 || !parts[idx + 1]) return null;

    const fileKey = parts[idx + 1];
    const name = parts[idx + 2] ? decodeURIComponent(parts[idx + 2].replace(/\+/g, " ")) : "Untitled";

    // node-id can be ?node-id=123%3A456 or 123-456
    const nodeParam = url.searchParams.get("node-id") || url.searchParams.get("node_id") || undefined;
    const nodeId = nodeParam ? decodeURIComponent(nodeParam).replace(/-/g, ":") : undefined;

    return { fileKey, nodeId, name };
  } catch {
    return null;
  }
}