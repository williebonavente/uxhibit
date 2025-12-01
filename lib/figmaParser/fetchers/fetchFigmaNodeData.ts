import { FIGMA_TOKEN } from "@/constants/figma_token";

export async function fetchFigmaNodeData(fileKey: string, ids: string[], token: string) {
  const isOAuth = !token.startsWith("FIGMA_") && token.length > 0; // heuristic optional; using presence from caller is fine
  const headers: HeadersInit = isOAuth
    ? { Authorization: `Bearer ${token}` }
    : { "X-Figma-Token": token };
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${ids.map(encodeURIComponent).join(",")}`,
    { headers }
  );
  return res.json();
}