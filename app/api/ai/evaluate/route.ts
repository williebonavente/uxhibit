import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN!;

// Azure OpenAI env
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;

// Helpers
function countNodesOfType(node: any, type: string): number {
  if (!node) return 0;
  let c = node.type === type ? 1 : 0;
  if (Array.isArray(node.children)) {
    for (const child of node.children) c += countNodesOfType(child, type);
  }
  return c;
}

async function firstFrameId(fileKey: string) {
  const r = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": FIGMA_TOKEN },
    cache: "no-store",
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
  issues: { id: string; severity: "low" | "medium" | "high"; message: string; suggestion: string }[];
  category_scores: {
    accessibility?: number;
    typography?: number;
    color?: number;
    layout?: number;
    hierarchy?: number;
    usability?: number;
  };
};

async function critiqueWithAI(imageUrl: string, fileJson: any, heuristics: any): Promise<AiCritique | null> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT) return null;

  const pages = fileJson?.document?.children ?? [];
  const firstPage = pages[0];
  const frameCount = firstPage?.children?.filter((n: any) => n.type === "FRAME").length ?? 0;
  const textCount = countNodesOfType(firstPage, "TEXT");

  const prompt = `You are a senior UI/UX reviewer. Critique the provided UI screenshot with concrete, actionable feedback.
Return ONLY valid JSON with these fields:
{
  "overall_score": number (0-100),
  "summary": string,
  "strengths": string[],
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

Context (from Figma file analysis):
- pages: ${pages.length}
- first_page_frames: ${frameCount}
- first_page_text_layers: ${textCount}
- heuristics: ${JSON.stringify(heuristics)}

Rules:
- Be specific (name spacing, contrast, alignment, tap targets, font sizes, color usage).
- Prefer platform-agnostic guidance (web/app).
- Do not mention being an AI.
- Output JSON only.`;

  const body = {
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 700,
  };

  const res = await fetch(
    `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE_OPENAI_API_KEY },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;

  try {
    return JSON.parse(content) as AiCritique;
  } catch {
    const match = content.match(/\{[\s\S]*\}$/);
    return match ? (JSON.parse(match[0]) as AiCritique) : null;
  }
}

export async function POST(req: Request) {
  const { fileKey, nodeId, scale = 3 } = await req.json().catch(() => ({}));
  if (!FIGMA_TOKEN || !fileKey) {
    return NextResponse.json({ error: "Missing params or token" }, { status: 400 });
  }

  const nid = nodeId || (await firstFrameId(fileKey));
  if (!nid) return NextResponse.json({ error: "No renderable frame" }, { status: 404 });

  const imgMeta = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nid)}&format=png&scale=${scale}`,
    { headers: { "X-Figma-Token": FIGMA_TOKEN } }
  ).then((r) => r.json());
  const imageUrl = imgMeta?.images?.[nid];
  if (!imageUrl) return NextResponse.json({ error: "Image URL missing" }, { status: 502 });

  const fileJson = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": FIGMA_TOKEN },
    cache: "no-store",
  }).then((r) => r.json());

  const pages = fileJson?.document?.children ?? [];
  const hasText = JSON.stringify(pages).includes('"type":"TEXT"');
  const firstPage = pages[0];
  const frameCount = firstPage?.children?.filter((n: any) => n.type === "FRAME").length ?? 0;

  const heuristics = {
    hasText,
    frameCount,
    notes: hasText ? [] : ["No text layers detected on the first page"],
  };

  const ai = await critiqueWithAI(imageUrl, fileJson, heuristics);

  return NextResponse.json({
    nodeId: nid,
    imageUrl,
    summary: "Evaluation complete.",
    heuristics,
    ai,
  });
}