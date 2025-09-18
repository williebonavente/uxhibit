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
            { "id": string, "severity": "low|medium|high", "message": string, "suggestion": string }
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
        - Be specific and actionable in your feedback.
        - In the "summary", explicitly mention how the design meets or misses expectations of the persona/demographics (e.g., Gen Z prefers vibrant colors, developers need clear dashboards).
        - If a category does not apply, set its score to 0.
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
    const { url, designId, nodeId, thumbnailUrl, snapshot } = await req.json();

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

    const heuristics = {};
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized - user not found' }, { status: 401 });
    }

    const frameResults = [];
    for (const [index, nodeId] of frameIds.entries()) {
        const imageUrl = frameImages[nodeId];
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
            thumbnail_url: thumbnailUrl,
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
        console.error("Upsert payload for design_versions:", upsertPayload);

        const { error, data } = await supabase.from("design_versions")
        .upsert(upsertPayload)
        .select();
        console.error("Upsert response - error:", error, "data:", data);

        if (error) {
            console.error("Supabase upsert error (design_versions):", error);
        } else {
            console.error("Supabase upsert success (design_versions):", data);
        }
    } catch (err) {
        console.error("Error in Supabase save (aggregate):", err);
    }

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