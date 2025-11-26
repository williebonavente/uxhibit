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

/**
 * Handles parsing of a Figma file or node URL, fetching metadata, images, and running analysis.
 * Returns a normalized JSON response with extracted frames, accessibility, layout, and detected elements.
 * 
 * @param url - The Figma file or node URL to parse.
 */
export async function handleFigmaParse(url: string) {
    // Check for required Figma API token
    if (!FIGMA_TOKEN) return NextResponse.json({ error: "Missing FIGMA_ACCESS_TOKEN" }, { status: 500 });

    // Parse the Figma URL to extract fileKey and nodeId
    const parsed = parseFigmaUrl(url);
    if (!parsed) return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });

    // Fetch the Figma file metadata from the API
    const fileRes = await fetch(`https://api.figma.com/v1/files/${parsed.fileKey}`, {
        headers: { "X-Figma-Token": FIGMA_TOKEN },
        cache: "no-store",
    });
    
    // Handle Figma rate limit errors
    if (fileRes.status === 429) {
        const retryAfter = fileRes.headers.get('Retry-After') || '60';
        return NextResponse.json(
            { 
                error: "Figma API rate limit exceeded",
                code: "FIGMA_RATE_LIMIT",
                retryAfter: parseInt(retryAfter, 10),
                message: "Figma allows 150 requests per minute. Please wait before trying again.",
                fileKey: parsed.fileKey 
            },
            { 
                status: 429,
                headers: {
                    'Retry-After': retryAfter
                }
            }
        );
    }
    
    if (!fileRes.ok) {
        const detail = await fileRes.text().catch(() => "");
        return NextResponse.json(
            { error: "Figma file fetch failed", status: fileRes.status, detail, fileKey: parsed.fileKey },
            { status: fileRes.status }
        );
    }
    const fileJson = await fileRes.json();

    // Extract all pages from the Figma document
    let targetPages: FigmaNode[] = [];
    const pages: FigmaNode[] = fileJson?.document?.children ?? [];

    // Determine which pages to target based on nodeId (single node or all pages)
    if (parsed.nodeId) {
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

    // Find the parent frame for the nodeId, if present
    let extractedFrameId: string | null = null;
    if (parsed.nodeId) {
        const parentFrame = findParentFrameInPages(pages, parsed.nodeId);
        if (parentFrame) {
            extractedFrameId = parentFrame.id;
        }
    }

    // Collect all frame IDs and themed frame IDs from the target pages
    const { ids: allFrameIds, themedIds } = targetPages.reduce(
        (acc: { ids: string[]; themedIds: string[] }, page: FigmaNode) => {
            const { ids, themedIds } = collectReasonableFrameIds(page, [], []);
            acc.ids.push(...ids);
            acc.themedIds.push(...themedIds);
            return acc;
        },
        { ids: [], themedIds: [] }
    );

    // Fetch node and frame images sequentially
    let nodeImageUrl: string | null = null;
    let frameImageUrl: string | null = null;
    
    if (parsed.nodeId) {
        nodeImageUrl = await fetchFigmaImage(parsed.fileKey, parsed.nodeId);
    }
    
    if (extractedFrameId) {
        frameImageUrl = await fetchFigmaImage(parsed.fileKey, extractedFrameId);
    }

    // Fetch images for all frames if there are any
    let frameImages: Record<string, string> = {};
    if (allFrameIds.length > 0) {
        const idsParam = allFrameIds.map(encodeURIComponent).join(",");
        const imgRes = await fetch(
            `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${idsParam}&format=png&scale=0.75`,
            { headers: { "X-Figma-Token": FIGMA_TOKEN } }
        );

        // Handle rate limit for image fetching
        if (imgRes.status === 429) {
            const retryAfter = imgRes.headers.get('Retry-After') || '60';
            return NextResponse.json(
                { 
                    error: "Figma API rate limit exceeded while fetching images",
                    code: "FIGMA_RATE_LIMIT",
                    retryAfter: parseInt(retryAfter, 10),
                    message: "Too many image requests. Please wait before trying again.",
                    fileKey: parsed.fileKey 
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter
                    }
                }
            );
        }

        if (imgRes.ok) {
            const imgJson = await imgRes.json();
            frameImages = imgJson.images || {};
        }
    }

    // Initialize metadata and accessibility variables
    let frameMetadata: Record<string, any> = {};
    let frameAccessibility: any[] = [];
    let allTextNodes: Record<string, TextNode[]> = {};
    let accessibilityResults: any = null;

    // Fetch frame metadata and run accessibility evaluation if there are frame IDs
    if (allFrameIds.length > 0) {
        const metadataJson = await fetchFigmaNodeData(parsed.fileKey, allFrameIds);
        frameMetadata = metadataJson?.nodes || {};

        // Evaluate accessibility for each frame
        accessibilityResults = evaluateFrameAccessibility({
            name: fileJson?.name ?? "",
            role: fileJson?.role ?? "",
            nodes: frameMetadata,
        });

        // Build a map of text nodes for each frame
        const frameTextMap = getFrameTextMap(frameMetadata);
        const frameScores = evaluateFrameScores(frameTextMap);

        // Group text nodes by frameId
        const groupedTextNodes: Record<string, any[]> = {};
        Object.values(frameTextMap).forEach(f => groupedTextNodes[f.frameId] = f.textNodes);

        // Assign variables for response
        frameAccessibility = frameScores;
        allTextNodes = groupedTextNodes;
    }

    // Normalize the document structure for downstream processing
    const normalized = normalizeDocument({
        name: fileJson?.name ?? "",
        role: fileJson?.role ?? "",
        nodes: frameMetadata,
    });

    // Evaluate layout for each normalized frame
    const layoutResults: Record<string, LayoutCheckResult> = {};
    if (normalized.frames) {
        normalized.frames.forEach(frame => {
            layoutResults[frame.id] = checkLayout(frame);
        });
    }

    let detectedButtons: any[] = [];
    if (Array.isArray(targetPages)) {
        detectedButtons = [];
        for (const page of targetPages) {
            // Traverse all frames in the page
            if (page.children) {
                for (const frame of page.children) {
                    const frameButtons = detectButtonsInFrame(frame).map(btn => ({
                        ...btn,
                        frameId: frame.id,
                        frameName: frame.name,
                        pageId: page.id,
                        pageName: page.name
                    }));
                    detectedButtons.push(...frameButtons);
                    if (frameButtons.length > 0) {
                        console.log(`Buttons detected in frame "${frame.name}" (page "${page.name}"):`, frameButtons);
                    }
                }
            }
        }
    }

    // Merge layout results into accessibility results for each frame
    if (Array.isArray(accessibilityResults)) {
        accessibilityResults.forEach(result => {
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
        message: parsed.nodeId
            ? "Parsed a single node image."
            : "Parsed all frame images in the file.",
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