export function parseFigmaUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    if (!/^(www\.)?figma\.com$/i.test(u.hostname)) return null;

    const parts = u.pathname.split("/").filter(Boolean);
    const section = parts[0]; // file | design | proto
    const fileKey = parts[1];

    if (!["file", "design", "proto"].includes(section) || !fileKey) return null;

    const nodeId = u.searchParams.get("node-id") || undefined;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}