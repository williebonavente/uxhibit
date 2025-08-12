import { NextResponse } from "next/server";
import { parseFigmaUrl } from "@/lib/figma";

export const runtime = "nodejs";
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN as string;

async function firstRenderableNodeId(fileKey: string) {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { "X-Figma-Token": FIGMA_TOKEN },
        cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pages = json?.document?.children ?? [];
    // try first FRAME in first page
    const firstPage = pages[0];
    const frame = firstPage?.children?.find((n: any) => n?.type === "FRAME");
    return frame?.id ?? null;
}

function placeholder(req: Request) {
    // Redirect to a local placeholder image instead of JSON
    return NextResponse.redirect(new URL("/images/design-thumbnail.png", req.url), 302);
}


export async function GET(req: Request) {
    if (!FIGMA_TOKEN) return NextResponse.json({ error: "Missing FIGMA_ACCESS_TOKEN" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url");
    let fileKey = searchParams.get("fileKey") || undefined;
    let nodeId = searchParams.get("nodeId") || undefined;
    const scale = Number(searchParams.get("scale") || "2");


    // Normalize common mistake: "1-82" -> "1:82"
    if (nodeId && /^\d+-\d+$/.test(nodeId)) nodeId = nodeId.replace("-", ":");

    if (!fileKey && urlParam) {
        const parsed = parseFigmaUrl(urlParam);
        fileKey = parsed?.fileKey;
        nodeId = nodeId || parsed?.nodeId || undefined;
    }
    if (!fileKey) return placeholder(req);

    if (!nodeId) {
        nodeId = await firstRenderableNodeId(fileKey);
        if (!nodeId) return placeholder(req);
    }
    if (!fileKey && urlParam) {
        const parsed = parseFigmaUrl(urlParam);
        fileKey = parsed?.fileKey;
        nodeId = nodeId || parsed?.nodeId || undefined;
    }
    if (!fileKey) return NextResponse.json({ error: "Missing fileKey or url" }, { status: 400 });

    if (!nodeId) {
        nodeId = await firstRenderableNodeId(fileKey);
        if (!nodeId) return NextResponse.json({ error: "No renderable node found" }, { status: 404 });
    }

    const imgRes = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=${scale}`,
        { headers: { "X-Figma-Token": FIGMA_TOKEN } }
    );
    if (!imgRes.ok) {
        const detail = await imgRes.text().catch(() => "");
        return NextResponse.json({ error: "Figma images failed", detail }, { status: imgRes.status });
    }
    const data = await imgRes.json();
    const signedUrl = data.images?.[nodeId];
    if (!signedUrl) return NextResponse.json({ error: "No image URL" }, { status: 404 });

    const file = await fetch(signedUrl);
    return new NextResponse(file.body, {
        headers: {
            "Content-Type": file.headers.get("Content-Type") || "image/png",
            "Cache-Control": "public, max-age=3600",
        },
    });
}