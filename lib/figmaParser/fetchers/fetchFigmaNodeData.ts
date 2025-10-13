import { FIGMA_TOKEN } from "@/constants/figma_token";

export async function fetchFigmaNodeData(fileKey: string, ids: string[]): Promise<any> {
  const idsParam = ids.map(encodeURIComponent).join(",");
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${idsParam}`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  );
  if (!res.ok) return null;
  return res.json();
}