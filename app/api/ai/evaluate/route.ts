import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { evaluateFrames } from "@/lib/ai/evaluateFrames";
import { saveDesignVersion } from "@/lib/ai/saveDesignVersion";
export const runtime = "nodejs";

export async function POST(req: Request) {
    console.log("[AI Evaluate] POST request received");

    const { url, designId, nodeId, thumbnailUrl, fallbackImageUrl, versionId, snapshot } = await req.json();
    console.log("[AI Evaluate] Request body:", { url, designId, nodeId, thumbnailUrl, fallbackImageUrl, versionId, snapshot });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[AI Evaluate] Supabase user:", user);
    if (authError) console.log("[AI Evaluate] Supabase auth error:", authError);

    if (!url) {
        console.log("[AI Evaluate] Missing Figma URL");
        return NextResponse.json({ error: "Missing Figma URL" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log("[AI Evaluate] Parsing Figma file at:", baseUrl);

    const parseRes = await fetch(`${baseUrl}/api/figma/parse`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ url }),
    });

    console.log("[AI Evaluate] Figma parse response status:", parseRes.status);

    if (!parseRes.ok) {
        const detail = await parseRes.text();
        console.log("[AI Evaluate] Failed to parse Figma file. Detail:", detail);
        return NextResponse.json({ error: "Failed to parse Figma file", detail }, { status: 500 });
    }

    const parseData = await parseRes.json();
    console.log("[AI Evaluate] Parsed Figma data:", parseData);

    const fileKey = parseData.fileKey;
    const frameImages = parseData.frameImages || {};
    const frameIds = Object.keys(frameImages);

    console.log("[AI Evaluate] Extracted frame IDs:", frameIds);

    if (frameIds.length === 0) {
        console.log("[AI Evaluate] No frames found in Figma file");
        return NextResponse.json({
            error: "No frames found in Figma file",
            details: parseData
        }, { status: 400 });
    }

    if (!designId) {
        console.log("[AI Evaluate] Missing designId param");
        return NextResponse.json({
            error: "Missing required params",
            details: {
                hasFileKey: !!fileKey,
                hasDesignId: !!designId
            }
        }, { status: 400 });
    }

    let finalThumbnailUrl = thumbnailUrl;
    if (!finalThumbnailUrl) {
        const { data: designRow } = await supabase
            .from("designs")
            .select("thumbnail_url")
            .eq("id", designId)
            .maybeSingle();
        if (designRow?.thumbnail_url) finalThumbnailUrl = designRow.thumbnail_url;
        console.log("[AI Evaluate] Fetched thumbnail from DB:", finalThumbnailUrl);
    }

    console.log("[AI Evaluate] Snapshot value:", snapshot);

    // Start evaluation asynchronously
    (async () => {
        console.log("[AI Evaluate] Starting frame evaluation...");
        const { frameResults, total_score, summary } = await evaluateFrames({
            frameIds,
            frameImages,
            user,
            designId,
            fileKey,
            versionId,
            snapshot,
            authError,
            supabase,
            figmaFileUrl: url,
        });

        console.log("[AI Evaluate] Frame evaluation results:", { frameResults, total_score, summary });

        await saveDesignVersion({
            supabase,
            designId,
            fileKey,
            nodeId,
            thumbnailUrl: finalThumbnailUrl,
            fallbackImageUrl,
            summary,
            frameResults,
            total_score,
            snapshot,
            user: user ?? undefined,
        });

        console.log("[AI Evaluate] Design version saved for designId:", designId);
    })();

    // Respond immediately
    console.log("[AI Evaluate] Responding immediately: processing started");
    return NextResponse.json({
        status: "processing",
        message: "AI evaluation started. Results will be available soon.",
        frameCount: frameIds.length,
        designId,
    });
}