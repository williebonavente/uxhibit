import { FIGMA_TOKEN } from "@/constants/figma_token";

export async function fetchFigmaImage(fileKey: string, nodeId: string, token: string) {
  const isOAuth = !token.startsWith("FIGMA_") && token.length > 0; // or rely on caller context
  const headers: HeadersInit = isOAuth
    ? { Authorization: `Bearer ${token}` }
    : { "X-Figma-Token": token };
  const res = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=0.75`,
    { headers }
  );
  const json = await res.json();
  return json.images?.[nodeId] || null;
}