import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { evaluateFrames } from "@/lib/ai/evaluateFrames";
import { saveDesignVersion } from "@/lib/ai/saveDesignVersion";
export const runtime = "nodejs";


export async function POST(req: Request) {
    const { url, designId, nodeId, thumbnailUrl, fallbackImageUrl, versionId, snapshot } = await req.json();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!url) {
        return NextResponse.json({ error: "Missing Figma URL" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const parseRes = await fetch(`${baseUrl}/api/figma/parse`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ url }),
    });

    if (!parseRes.ok) {
        const detail = await parseRes.text();
        return NextResponse.json({ error: "Failed to parse Figma file", detail }, { status: 500 });
    }

    const parseData = await parseRes.json();
    const fileKey = parseData.fileKey;
    const frameImages = parseData.frameImages || {};
    const frameIds = Object.keys(frameImages);

    if (frameIds.length === 0) {
        return NextResponse.json({
            error: "No frames found in Figma file",
            details: parseData
        }, { status: 400 });
    }

    if (!designId) {
        return NextResponse.json({
            error: "Missing required params",
            details: {
                hasFileKey: !!fileKey,
                hasDesignId: !!designId
            }
        }, { status: 400 });
    }

    // Start evaluation in background (do not await)
    // `validResults`
    (async () => {
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
        });

        await saveDesignVersion({
            supabase,
            designId,
            fileKey,
            nodeId,
            thumbnailUrl,
            fallbackImageUrl,
            summary,
            frameResults,
            total_score,
            snapshot,
            user: user ?? undefined,
        });
    })();

    // Respond immediately
    return NextResponse.json({
        status: "processing",
        message: "AI evaluation started. Results will be available soon.",
        frameCount: frameIds.length,
        designId,
    });
}