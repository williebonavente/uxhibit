import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai"
export const runtime = "nodejs";

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN!;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; // fallback to your existing var


function countNodesOfType(node: any, type: string): number {
    if (!node) return 0;
    let c = node.type === type ? 1 : 0;
    if (Array.isArray(node.children)) for (const child of node.children) c += countNodesOfType(child, type);
    return c;
}

async function firstFrameId(fileKey: string) {
    const r = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { "X-Figma-Token": FIGMA_TOKEN }, cache: "no-store",
    });
    if (!r.ok) return null;
    const j = await r.json();
    const firstPage = j?.document?.children?.[0];
    return firstPage?.children?.find((n: any) => n.type === "FRAME")?.id ?? null;
}

type AiCritique = {
    overall_score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    issues: { id: string; severity: "low" | "medium" | "high"; message: string; suggestion: string }[];
    category_scores: {
        accessibility?: number; typography?: number; color?: number;
        layout?: number; hierarchy?: number; usability?: number;
    };
};

async function critiqueWithMistral(imageUrl: string, fileJson: any, heuristics: any): Promise<AiCritique | null> {
    if (!MISTRAL_API_KEY) return null;

    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const pages = fileJson?.document?.children ?? [];
    const firstPage = pages[0];
    const frameCount = firstPage?.children?.filter((n: any) => n.type === "FRAME").length ?? 0;
    const textCount = countNodesOfType(firstPage, "TEXT");

    const prompt = `You are a senior UI/UX reviewer. Critique the provided UI screenshot with concrete, actionable feedback.
Identify what colors of the frames are, what are the identity.
Return ONLY valid JSON with:
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
Context:
- pages: ${pages.length}
- first_page_frames: ${frameCount}
- first_page_text_layers: ${textCount}
- heuristics: ${JSON.stringify(heuristics)}
Rules: be specific (contrast, spacing, alignment, tap targets, font sizes, colors). Output JSON only.`;

    try {
        const completion = await client.chat.complete({
            model: 'pixtral-12b',
            temperature: 0.2,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", imageUrl },
                    ],
                },
            ],
        });

        const msg = completion?.choices?.[0]?.message;
        // console.log(msg);
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
            return match ? (JSON.parse(match[0]) as AiCritique) : null;
        }
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
}

export async function POST(req: Request) {

    const { fileKey, nodeId, scale = 3, fallbackImageUrl } = await req.json().catch(() => ({})); // added fallback

    if (!FIGMA_TOKEN || !fileKey) {
        return NextResponse.json({ error: "Missing params or token" }, { status: 400 });
    }

    const nid = nodeId || (await firstFrameId(fileKey));
    if (!nid) return NextResponse.json({ error: "No renderable frame" }, { status: 404 });

    // Signed image URL from Figma (publicly fetchable)
    const imgMeta = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nid)}&format=png&scale=${scale}`,
        { headers: { "X-Figma-Token": FIGMA_TOKEN } }
    ).then(r => r.json());
    let imageUrl = imgMeta?.images?.[nid];
    if (!imageUrl && fallbackImageUrl) imageUrl = fallbackImageUrl; // added fallback use
    if (!imageUrl) {
        return NextResponse.json(
            { error: "Image URL missing (no Figma render and no fallbackImageUrl provided)" },
            { status: 502 }
        );
    }
    // Call AI and capture status/error
    let ai: AiCritique | null = null;
    let ai_error: string | undefined;

    // File JSON for heuristics
    const fileJson = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { "X-Figma-Token": FIGMA_TOKEN }, cache: "no-store",
    }).then(r => r.json());


    const pages = fileJson?.document?.children ?? [];
    const hasText = JSON.stringify(pages).includes('"type":"TEXT"');
    const firstPage = pages[0];
    const frameCount = firstPage?.children?.filter((n: any) => n.type === "FRAME").length ?? 0;
    const heuristics = {
        hasText,
        frameCount,
        notes: hasText ? [] : ["No text layers detected on the first page"],
    };
    try {
        ai = await critiqueWithMistral(imageUrl, fileJson, heuristics);
        if (!ai) ai_error = "mistral_skipped_or_empty";
    } catch (e: any) {
        ai_error = `mistral_error: ${e?.message || "unknown"}`;
        console.log(ai_error);
    }


    return NextResponse.json({
        nodeId: nid,
        imageUrl,
        heuristics,
        ai_status: ai ? "ok" : "skipped",
        ai_error,
        summary: ai?.summary ?? "Evaluation complete.",
        overall_score: ai?.overall_score ?? null,
        strengths: Array.isArray(ai?.strengths) ? ai!.strengths : [],
        weaknesses: Array.isArray(ai?.weaknesses) ? ai!.weaknesses : [], // added
        issues: Array.isArray(ai?.issues) ? ai!.issues : [],
        category_scores: ai?.category_scores ?? null,
        ai,
    });
}