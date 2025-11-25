import { NextResponse } from "next/server";
import { parseFigmaUrl } from "@/lib/figma";
import { collectReasonableFrameIds } from "@/lib/figmaFrame/checker";
import { FigmaNode, TextNode } from "@/lib/declaration/figmaInfo";
import { normalizeDocument } from "@/utils/extractor/metadataExtractor";
import { evaluateFrameAccessibility } from "@/utils/contrastChecker/frameAccessibility";
import { evaluateFrameScores } from "@/lib/frameScorer/frameScorer";
import { getFrameTextMap } from "@/utils/extractor/frameExtractor";
import { fetchFigmaImage } from "../fetchers/fetchFigmaImage";
import { fetchFigmaNodeData } from "../fetchers/fetchFigmaNodeData";
import { FIGMA_TOKEN } from "@/constants/figma_token";
import { LayoutCheckResult } from "@/lib/declaration/figmaLayout";
import { checkLayout } from "@/utils/extractor/frameLayoutChecker";
import { findParentFrameInPages } from "@/utils/extractor/findParentFrameInPages";
import { detectButtonsParallel } from "@/lib/ai/interactiveElements/buttons/detectButtonsParallel";
import { detectButtonsInFrame } from "@/lib/ai/interactiveElements/buttons/detectButtons";
import { getFigmaFile, getFigmaImagesChunked } from "@/utils/figma/figmaApi";

/**
 * Handles parsing of a Figma file or node URL, fetching metadata, images, and running analysis.
 * Returns a normalized JSON response with extracted frames, accessibility, layout, and detected elements.
 * 
 * @param url - The Figma file or node URL to parse.
 */

async function retryFigmaCall<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.message?.includes('429');
      const isLastAttempt = attempt === maxRetries;
      
      if (!is429 || isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function handleFigmaParse(url: string) {
  if (!FIGMA_TOKEN) return NextResponse.json({ error: "Missing FIGMA_ACCESS_TOKEN" }, { status: 500 });

  const parsed = parseFigmaUrl(url);
  if (!parsed) return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });

    // File metadata (cached / retry inside getFigmaFile)
  const fileJson = await retryFigmaCall(() => getFigmaFile(parsed.fileKey, FIGMA_TOKEN));
  const pages: FigmaNode[] = fileJson?.document?.children ?? [];

  // Select target pages
  let targetPages: FigmaNode[] = [];
  if (parsed.nodeId) {
    targetPages = pages.filter((page) => {
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

  // Parent frame detection
  let extractedFrameId: string | null = null;
  if (parsed.nodeId) {
    const parentFrame = findParentFrameInPages(pages, parsed.nodeId);
    if (parentFrame) extractedFrameId = parentFrame.id;
  }
  // Collect frame IDs from pages
  const { ids: allFrameIds, themedIds } = targetPages.reduce(
    (acc: { ids: string[]; themedIds: string[] }, page: FigmaNode) => {
      const r = collectReasonableFrameIds(page, [], []);
      acc.ids.push(...r.ids);
      acc.themedIds.push(...r.themedIds);
      return acc;
    },
    { ids: [], themedIds: [] }
  );

  // Batch image fetch (node + parent + frames)
  const imageIds = Array.from(new Set([
    ...(parsed.nodeId ? [parsed.nodeId] : []),
    ...(extractedFrameId ? [extractedFrameId] : []),
    ...allFrameIds
  ]));

    const imagesMap = await retryFigmaCall(() => 
    getFigmaImagesChunked(parsed.fileKey, imageIds, FIGMA_TOKEN, 0.75)
  );
  const nodeImageUrl = parsed.nodeId ? imagesMap[parsed.nodeId] || null : null;
  const frameImageUrl = extractedFrameId ? imagesMap[extractedFrameId] || null : null;

  const frameImages: Record<string, string> = {};
  for (const fid of allFrameIds) {
    if (imagesMap[fid]) frameImages[fid] = imagesMap[fid];
  }

  // Metadata + accessibility + text extraction
  let frameMetadata: Record<string, any> = {};
  let frameAccessibility: any[] = [];
  let allTextNodes: Record<string, TextNode[]> = {};
  let accessibilityResults: any = null;

  if (allFrameIds.length > 0) {
        const nodeData = await retryFigmaCall(() => 
      fetchFigmaNodeData(parsed.fileKey, allFrameIds)
    );
    frameMetadata = nodeData?.nodes || {};

    accessibilityResults = evaluateFrameAccessibility({
      name: fileJson?.name ?? "",
      role: fileJson?.role ?? "",
      nodes: frameMetadata,
    });

    const frameTextMap = getFrameTextMap(frameMetadata);
    const frameScores = evaluateFrameScores(frameTextMap);

    const groupedTextNodes: Record<string, TextNode[]> = {};
    Object.values(frameTextMap).forEach((f: any) => {
      groupedTextNodes[f.frameId] = f.textNodes;
    });

    frameAccessibility = frameScores;
    allTextNodes = groupedTextNodes;
  }

  // Normalize + layout evaluation
  const normalized = normalizeDocument({
    name: fileJson?.name ?? "",
    role: fileJson?.role ?? "",
    nodes: frameMetadata,
  });

  const layoutResults: Record<string, LayoutCheckResult> = {};
  if (normalized.frames) {
    normalized.frames.forEach((frame: any) => {
      layoutResults[frame.id] = checkLayout(frame);
    });
  }

  // Button detection
  const detectedButtons: any[] = [];
  for (const page of targetPages) {
    if (!page.children) continue;
    for (const frame of page.children) {
      const frameButtons = detectButtonsInFrame(frame).map((btn) => ({
        ...btn,
        frameId: frame.id,
        frameName: frame.name,
        pageId: page.id,
        pageName: page.name,
      }));
      if (frameButtons.length) detectedButtons.push(...frameButtons);
    }
  }

  // Merge layout scores into accessibility results
  if (Array.isArray(accessibilityResults)) {
    accessibilityResults.forEach((result: any) => {
      const layout = layoutResults[result.frameId];
      if (layout) {
        result.layoutScore = layout.score;
        result.layoutIssues = layout.issues;
        result.layoutSummary = layout.summary;
      }
    });
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
    message: parsed.nodeId ? "Parsed a single node image." : "Parsed all frame images in the file.",
    detectedButtons,
    extractedFrameId,
    extractedFrameImageUrl: frameImageUrl,
    frameMetadata,
    normalizedFrames: normalized.frames ?? [],
    textNodes: allTextNodes ?? {},
    accessbilityScores: frameAccessibility ?? [],
    accessibilityResults: accessibilityResults ?? {},
    layoutResults,
  });
}