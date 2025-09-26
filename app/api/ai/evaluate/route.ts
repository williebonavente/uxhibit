import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai"
import { createClient } from "@/utils/supabase/server";
import { getNextVersion } from "@/database/actions/versions/versionHistory";
export const runtime = "nodejs";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

type AiCritique = {
    overall_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    issues: {
        id: string; severity: "low" | "medium" | "high";
        message: string;
        suggestion: string
    }[];
    category_scores: {
        accessibility?: number; typography?: number; color?: number;
        layout?: number; hierarchy?: number; usability?: number;
    };
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function critiqueWithMistral(
    imageUrl: string,
    heuristics: any,
    snapshot?: Record<string, unknown>): Promise<AiCritique | null> {
    if (!MISTRAL_API_KEY) return null;

    const client = new Mistral({ apiKey: MISTRAL_API_KEY });

    const prompt = `You are a senior UI/UX reviewer. Critique the provided UI screenshot with concrete, actionable feedback.
    Be specific about issues such as contrast, spacing, alignment, tap targets, font sizes, and colors.
    Identify the main color palette and any unique visual identity elements.

    Context:
    - heuristics: ${JSON.stringify(heuristics)}
    ${snapshot ? `- persona: ${JSON.stringify(snapshot)}` : ""}
    Return ONLY valid JSON in the following format:
    {
    "overall_score": number (0-100),
    "summary": string, 
    "strengths": string[],
    "weaknesses": string[],
    "issues": [
        { 
          "id": string, 
          "heuristic": string (e.g. "01" for Visibility of System Status, "02" for Match Between System and the Real World, ... "10" for Help and Documentation),
          "severity": "low|medium|high", 
          "message": string, // This must clearly explain why the heuristic is violated in this UI/frame 
          "suggestion": string 
        }
    ],
    "category_scores": {
        "accessibility": number,
        "typography": number,
        "color": number,
        "layout": number,
        "hierarchy": number,
        "usability": number
        }
    }
        Rules:
        - Output valid JSON only, no extra commentary.
        - For each issue, always include the "heuristic" field as a two-digit string ("01"-"10") matching Jakob Nielsen's 10 Usability Heuristics.
        - For each issue, the "message" field must clearly explain why this heuristic is violated in this specific UI/frame.
        - Be specific and actionable in your feedback.
        - In the "summary", explicitly mention how the design meets or misses expectations of the persona/demographics (e.g., Gen Z prefers vibrant colors, developers need clear dashboards).
        - If a category does not apply, set its score to 0.
        - For each issue, the "heuristic" field must match one of the following:
        "01" - Visibility of System Status
        "02" - Match Between System and the Real World
        "03" - User Control and Freedom
        "04" - Consistency and Standards
        "05" - Error Prevention
        "06" - Recognition Rather than Recall
        "07" - Flexibility and Efficiency of Use
        "08" - Aesthetic and Minimalist Design
        "09" - Help Users Recognize, Diagnose, and Recover from Errors
        "10" - Help and Documentation
`;


    try {
        const completion = await client.chat.complete({
            model: 'pixtral-12b',
            temperature: 0.2,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", imageUrl: { url: imageUrl } }
                    ]
                },
            ],
        });

        const msg = completion?.choices?.[0]?.message;
        console.log(msg);
        const contentStr: string | undefined =
            typeof msg?.content === "string"
                ? msg.content
                : Array.isArray(msg?.content)
                    ? (msg.content.find((p: any) => p.type === "text")?.text as string | undefined)
                    : undefined;
        if (!contentStr) return null;

        const cleaned = contentStr
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            return JSON.parse(cleaned) as AiCritique;
        } catch {
            const match = contentStr.match(/\{[\s\S]*\}$/);
            if (match) {
                try {
                    return (JSON.parse(match[0]) as AiCritique);
                } catch (err2) {
                    console.warn("Failed to parse extracted JSON: ", err2);
                }
            }
        }
        console.warn("AI produced non-JSON response, saving raw text as summary.");
        return {
            overall_score: 0,
            summary: cleaned,
            strengths: [],
            weaknesses: [],
            issues: [],
            category_scores: {},
        } as AiCritique;
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
}

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

    const frameSupabaseUrls: Record<string, string> = {};

    // --- Download and upload each frame image to Supabase Storage ---
    for (const [frameId, figmaUrl] of Object.entries(frameImages) as [string, string][]) {
        let supabaseUrl: string | null = null;
        try {
            console.log(`Server: Downloading image for frame ${frameId} from Figma: ${figmaUrl}`);
            const imgRes = await fetch(figmaUrl);
            if (!imgRes.ok) {
                console.error(`Server: Failed to download image for frame ${frameId}: HTTP ${imgRes.status}`);
                frameSupabaseUrls[frameId] = figmaUrl;
                continue;
            }
            const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
            const filePath = `${user?.id}/${designId}/${frameId}.png`;
            console.log(`Server: Uploading to Supabase Storage at path: ${filePath}`);

            const { data, error } = await supabase.storage
                .from('figma-frames')
                .upload(filePath, imgBuffer, {
                    contentType: 'image/png',
                    upsert: true,
                });

            if (error) {
                console.error(`Server: Supabase upload error for frame ${frameId}:`, error);
            } else {
                console.log(`Server: Supabase upload success for frame ${frameId}:`, data);
                // Generate a signed URL (valid for 1 year)
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('figma-frames')
                    .createSignedUrl(filePath, 60 * 60 * 24 * 365);
                if (signedError) {
                    console.error(`Server: Error generating signed URL for frame ${frameId}: `, signedError);
                } else if (signedData?.signedUrl) {
                    supabaseUrl = signedData.signedUrl;
                    console.log(`Server: Signed URL from frame ${frameId}: `, supabaseUrl);
                }
            }
        } catch (err) {
            console.error(`Server: Error downloading or uploading Figma image for frame ${frameId}:`, err);
        }
        // Always set a value for this frameId
        frameSupabaseUrls[frameId] = supabaseUrl || figmaUrl;
    }

    const heuristics = {};
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized - user not found' }, { status: 401 });
    }

    const frameResults = [];
    for (const [index, nodeId] of frameIds.entries()) {
        // TODO: Watchout for this code right??!! 
        const imageUrl = frameSupabaseUrls[nodeId] || frameImages[nodeId];
        console.log(`Evaluating frame ${index + 1} of ${frameIds.length} (nodeId: ${nodeId})`);
        let ai: AiCritique | null = null;
        let ai_error: string | undefined;

        if (index === frameIds.length - 1) {
            console.log(`Last frame (${index + 1}) evaluated.`);
        }
        try {
            ai = await critiqueWithMistral(imageUrl, heuristics, snapshot);
            if (!ai) ai_error = "mistral_skipped_or_empty";
            if (ai && Array.isArray(ai.issues)) {
                ai.issues = ai.issues.map((issue, issueIdx) => ({
                    ...issue,
                    id: `frame${index + 1}-issue${issueIdx}`,
                }));
            }
        } catch (e: unknown) {
            ai_error = `mistral_error: ${e instanceof Error ? e.message : "unknown"}`;
            console.log(ai_error);
        }

        if (ai) {
            try {
                await supabase.from("design_frame_evaluations").upsert({
                    design_id: designId,
                    file_key: fileKey,
                    node_id: nodeId,
                    thumbnail_url: imageUrl,
                    ai_summary: ai.summary || null,
                    ai_data: ai,
                    snapshot: (() => {
                        if (!snapshot) return null;
                        if (typeof snapshot === "string") {
                            try { return JSON.parse(snapshot); } catch { return null; }
                        }
                        return snapshot;
                    })(),
                    created_at: new Date().toISOString(),
                    owner_id: user.id
                });
            } catch (err) {
                console.error("Error in Supabase save (frame):", err);
            }
        }

        frameResults.push({
            node_id: nodeId,
            thumbnail_url: imageUrl,
            ai,
            ai_error,
        });
        // Delayed per API response
        await sleep(2000);
    }
    console.log(`All ${frameIds.length} frames evaluated. Aggregating results and saving design version...`);

    // 2. Aggregate results for design_versions
    console.error("Aggregating frameResults:", frameResults);

    const validResults = frameResults.filter(r => r.ai);
    console.error("Valid results for aggregation:", validResults);

    const total_score = validResults.length
        ? Math.round(validResults.reduce((sum, r) => sum + (r.ai?.overall_score ?? 0), 0) / validResults.length)
        : 0;
    console.error("Calculated total_score:", total_score);

    const summary = `Aggregate summary: ${validResults.map(r => r.ai?.summary).join(" | ")}`;
    console.error("Aggregate summary string:", summary);

    try {
        const nextVersion = await getNextVersion(supabase, designId);
        console.error("Next version for design_versions:", nextVersion);
        const upsertPayload = {
            design_id: designId,
            file_key: fileKey,
            node_id: nodeId,
            thumbnail_url: thumbnailUrl || fallbackImageUrl,
            ai_summary: summary,
            ai_data: frameResults,
            total_score,
            snapshot: (() => {
                if (!snapshot) return null;
                if (typeof snapshot === "string") {
                    try { return JSON.parse(snapshot); } catch { return null; }
                }
                return snapshot;
            })(),
            created_at: new Date().toISOString(),
            version: nextVersion,
            created_by: user.id
        };
        const { error, data } = await supabase.from("design_versions")
            // .upsert(upsertPayload)
            .insert(upsertPayload)
            .select();
        console.error("Upsert response - error:", error, "data:", data);

        const { data: versionRows, error: versionError } = await supabase
            .from("design_versions")
            .select("id")
            .eq("design_id", designId)
            .eq("version", nextVersion)
            .maybeSingle();

        if (versionError || !versionRows) {
            console.error("Failed to fetch new version id:", versionError);
        } else {
            const versionId = versionRows.id;
            console.log("Inserting frames for version_id:", versionId);
            for (const frame of frameResults) {
                const { error: frameError, data: frameData } = await supabase
                    .from("design_frame_evaluations")
                    .insert({
                        design_id: designId,
                        version_id: versionId,
                        file_key: fileKey,
                        node_id: frame.node_id,
                        thumbnail_url: frame.thumbnail_url,
                        ai_summary: frame.ai?.summary || null,
                        ai_data: frame.ai,
                        ai_error: frame.ai_error,
                        created_at: new Date().toISOString(),
                        snapshot: (() => {
                            if (!snapshot) return null;
                            if (typeof snapshot === "string") {
                                try { return JSON.parse(snapshot); } catch { return null; }
                            }
                            return snapshot;
                        })(),
                        owner_id: user.id
                    });
                if (frameError) {
                    console.error("Error inserting frame evaluation:", frameError);
                } else {
                    console.log(
                        `Inserted frame evaluation for node_id: ${frame.node_id} with version_id: ${versionId}`,
                        frameData
                    );
                }
            }
        }
        if (error) {
            console.error("Supabase upsert error (design_versions):", error);
        } else {
            console.error("Supabase upsert success (design_versions):", data);
        }
    } catch (err) {
        console.error("Error in Supabase save (aggregate):", err);
    }
    console.log("Received snapshot:", snapshot);

    return NextResponse.json({
        results: frameResults,
        frameCount: frameIds.length,
        message: "AI evaluation completed for all frames and aggregate saved.",
        // // Watchout about this error ones
        // accessibilityResults: parseData.accessibilityResults,
        // accessbilityScores: parseData.accessbilityScores,
        // normalizedFrames: parseData.normalizedFrames,
    });
}