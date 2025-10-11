import { FIGMA_TOKEN } from "@/constants/figma_token";

export async function fetchFigmaImage(fileKey: string, id: string): Promise<string | null> {
  const imgRes = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(id)}&format=png&scale=2`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  );
  if (imgRes.ok) {
    const imgJson = await imgRes.json();
    return imgJson.images?.[id] ?? null;
  }
  return null;
}