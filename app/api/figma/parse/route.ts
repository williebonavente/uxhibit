import { NextResponse } from "next/server";
import { parseFigmaUrl } from "@/lib/figma";
import {
  //  THEME_KEYWORDS, 
  //  isThemeRelevant,
  collectReasonableFrameIds
} from "@/lib/figmaFrame/checker";

export const runtime = "nodejs"; 

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;

type FigmaNode = {
  id: string;
  name?: string;
  type: string;
  visible?: boolean;
  absoluteBoundingBox?: { width: number; height: number };
  children?: FigmaNode[];
};

function findParentFrame(node: FigmaNode, targetId: string, parent: FigmaNode | null = null): FigmaNode | null {
  if (node.id === targetId) {
    if (parent && parent.type === "FRAME") return parent;
    return null;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findParentFrame(child, targetId, node.type === "FRAME" ? node : parent);
      if (found) return found;
    }
  }
  return null;
}

async function fetchFigmaImage(fileKey: string, id: string): Promise<string | null> {
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

async function handle(url: string) {
  if (!FIGMA_TOKEN) return NextResponse.json({ error: "Missing FIGMA_ACCESS_TOKEN" }, { status: 500 });
  const parsed = parseFigmaUrl(url);
  if (!parsed) return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });

  // File metadata
  const fileRes = await fetch(`https://api.figma.com/v1/files/${parsed.fileKey}`, {
    headers: { "X-Figma-Token": FIGMA_TOKEN },
    cache: "no-store",
  });
  if (!fileRes.ok) {
    const detail = await fileRes.text().catch(() => "");
    return NextResponse.json(
      { error: "Figma file fetch failed", status: fileRes.status, detail, fileKey: parsed.fileKey },
      { status: fileRes.status }
    );
  }
  const fileJson = await fileRes.json();
  let targetPages: FigmaNode[] = [];
  const pages: FigmaNode[] = fileJson?.document?.children ?? [];

  if (parsed.nodeId) {
    // Find the page (CANVAS) containing the nodeId
    targetPages = pages.filter((page: FigmaNode) => {
      function containsNode(node: FigmaNode): boolean {
        if (node.id === parsed?.nodeId) return true;
        if (node.children) return node.children.some(containsNode);
        return false;
      }
      return containsNode(page);
    });
  } else {
    targetPages = pages.length > 0 ? [pages[0]] : [];
  }

  let extractedFrameId: string | null = null;
  if (parsed.nodeId) {
    for (const page of pages) {
      const parentFrame = findParentFrame(page, parsed.nodeId);
      if (parentFrame) {
        extractedFrameId = parentFrame.id;
        break;
      }
    }
  }

  const nodeImageUrl = parsed.nodeId ? await fetchFigmaImage(parsed.fileKey, parsed.nodeId) : null;
  const frameImageUrl = extractedFrameId ? await fetchFigmaImage(parsed.fileKey, extractedFrameId) : null;

  const { ids: allFrameIds, themedIds } = targetPages.reduce(
    (acc: { ids: string[]; themedIds: string[] }, page: FigmaNode) => {
      const { ids, themedIds } = collectReasonableFrameIds(page, [], []);
      acc.ids.push(...ids);
      acc.themedIds.push(...themedIds);
      return acc;
    },
    { ids: [], themedIds: [] }
  );

  let frameImages: Record<string, string> = {};
  if (allFrameIds.length > 0) {
    const idsParam = allFrameIds.map(encodeURIComponent).join(",");
    const imgRes = await fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${idsParam}&format=png&scale=2`,
      { headers: { "X-Figma-Token": FIGMA_TOKEN } }
    );

    if (imgRes.ok) {
      const imgJson = await imgRes.json();
      frameImages = imgJson.images || {};
    }
  }

  return NextResponse.json({
    fileKey: parsed.fileKey,
    nodeId: parsed.nodeId ?? null,
    name: fileJson?.name ?? null,
    lastModified: fileJson?.lastModified ?? null,
    thumbnailUrl: fileJson?.thumbnailUrl ?? null,
    nodeImageUrl,
    frameImages,
    themedFrameIds: themedIds,
    type: parsed.nodeId ? "single-node" : "multi-frame",
    message: parsed.nodeId
      ? "Parsed a single node image."
      : "Parsed all frame images in the file.",
    extractedFrameId,
    extractedFrameImageUrl: frameImageUrl,
  });
}

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  return handle(url);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  return handle(url);
}