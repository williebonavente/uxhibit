import { FrameTextMap, TextNodeDetail } from "@/lib/declaration/scoringTypes";
import { FigmaNodesResponse, TextNode as FTextNode, RGBA } from "@/lib/declaration/figmaInfo";
import { extractTextNodes } from "./metadataExtractor";

/**
 * Build a map keyed by frameId containing text nodes and frame background color.
 * frameMetadata is the raw response from GET /v1/files/:fileKey/nodes -> nodes
 */
export function getFrameTextMap(frameMetadata: Record<string, any>): FrameTextMap {
    const map: FrameTextMap = {};

    Object.entries(frameMetadata).forEach(([frameId, nodeWrapper]) => {
        const doc = nodeWrapper?.document;
        if (!doc) return;

        // Ensure doc is a FigmaNode before passing to extractTextNodes
        if (doc.type === "FRAME" || doc.type === "GROUP" || doc.type === "COMPONENT") {
            const frameName = doc.name ?? frameId;
            const bgColor: RGBA | null = doc.backgroundColor ?? null;

            const textNodes = extractTextNodes(doc) ?? [];

            map[frameId] = {
                frameId,
                frameName,
                backgroundColor: bgColor,
                textNodes: textNodes as any,
                rawFrameNode: doc
            };
        }
    });

    return map;
}
