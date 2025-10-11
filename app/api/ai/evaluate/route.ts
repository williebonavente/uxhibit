import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { evaluateFrames } from "@/lib/ai/evaluateFrames";
import { saveDesignVersion } from "@/lib/ai/saveDesignVersion";
import { nanoid } from "nanoid";
export const runtime = "nodejs";

const jobId = nanoid();
export async function POST(req: Request) {
    const { url, designId, nodeId, thumbnailUrl, fallbackImageUrl, snapshot } = await req.json();

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

    // TODO:  `validResults` to be included later

    const { frameResults, total_score, summary
    } = await evaluateFrames({
        frameIds,
        frameImages,
        user,
        designId,
        figmaFileUrl: url,
        fileKey,
        snapshot,
        authError,
        supabase,
        jobId,
    });

    const { versionId } = await saveDesignVersion({
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

        // Before calling saveDesignVersion
    console.log("thumbnailUrl:", thumbnailUrl);
    console.log("fallbackImageUrl:", fallbackImageUrl);
    console.log("frameImages:", frameImages);

    if (parseData.accessibilityResults && versionId) {
        const saveRes = await fetch(`${baseUrl}/api/saveAccessibility`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                results: parseData.accessibilityResults,
                designVersionId: versionId,
            }),
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
            console.log("Accessibility results saved successfully for version:", versionId);
        } else {
            console.error("Failed to save accessibility results:", saveData.error);
        }
    }

    console.log("JobId: ", jobId);

    return NextResponse.json({
        jobId,
        results: frameResults,
        frameCount: frameIds.length,
        message: "AI evaluation completed for all frames and aggregate saved.",
        // // Watchout about this error ones
        // accessibilityResults: parseData.accessibilityResults,
        // accessbilityScores: parseData.accessbilityScores,
        // normalizedFrames: parseData.normalizedFrames,
    });
}