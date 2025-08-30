import { NextResponse } from "next/server";
import { parseFigmaUrl } from "@/lib/figma";

export const runtime = "nodejs"; // ensure env vars available in Node

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;

function figmaHeaders() {
  return { "X-Figma-Token": FIGMA_TOKEN };
}
async function handle(url: string) {
  if (!FIGMA_TOKEN) return NextResponse.json({ error: "Missing FIGMA_ACCESS_TOKEN" }, { status: 500 });
  const parsed = parseFigmaUrl(url);
  if (!parsed) return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });

  // File metadata
  const fileRes = await fetch(`https://api.figma.com/v1/files/${parsed.fileKey}`, {
    headers: figmaHeaders(),
    cache: "no-store",
  });
  if (!fileRes.ok) {
    const detail = await fileRes.text().catch(() => "");
    return NextResponse.json(
      { error: "Figma file fetch failed", status: fileRes.status, detail, fileKey: parsed.fileKey },
      { status: fileRes.status }
    );
  }
  const fileJson = await fileRes.json();

  // Optional node preview
  let nodeImageUrl: string | null = null;
  if (parsed.nodeId) {
    const imgRes = await fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${encodeURIComponent(parsed.nodeId)}&format=png&scale=2`,
      { headers: figmaHeaders() }
    );
    if (imgRes.ok) {
      const imgJson = await imgRes.json();
      nodeImageUrl = imgJson.images?.[parsed.nodeId] ?? null;
    }
  }

  return NextResponse.json({
    fileKey: parsed.fileKey,
    nodeId: parsed.nodeId ?? null,
    name: fileJson?.name ?? null,
    lastModified: fileJson?.lastModified ?? null,
    thumbnailUrl: fileJson?.thumbnailUrl ?? null,
    nodeImageUrl,
  });
}

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  return handle(url);
}



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  return handle(url);
}