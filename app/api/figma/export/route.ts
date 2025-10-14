import { NextResponse } from "next/server";

const FIGMA_API = "https://api.figma.com/v1";

type ExportRequest = {
    fileKey: string;
    nodeIds?: string[];
    mode?: "frames" | "nodes";
    scale?: number;
    format?: "png" | "jpg" | "svg";
    upload?: boolean;
    designId?: string;
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as ExportRequest;
        const { fileKey, nodeIds,
            mode = "frames",
            scale = 2,
            format = "png",
            upload = false,
            // designId
        } = body;
        if (!fileKey) return NextResponse.json({ error: "fileKey required" }, { status: 400 });

        const token = process.env.FIGMA_ACCESS_TOKEN;
        if (!token) return NextResponse.json({ error: "FIGMA_TOKEN missing" }, { status: 500 });

        let targets: string[] = [];

        if (mode === "nodes" && nodeIds?.length) {
            targets = nodeIds;
        } else {
            // Discover frames from file
            const fileResp = await fetch(`${FIGMA_API}/files/${fileKey}`, {
                headers: { "X-Figma-Token": token },
                cache: "no-store",
            });
            if (!fileResp.ok) {
                const t = await fileResp.text();
                return NextResponse.json({ error: `Figma file fetch failed: ${t}` }, { status: 502 });
            }
            const fileJson = await fileResp.json();
            const frames: string[] = [];
            const stack: any[] = fileJson.document ? [fileJson.document] : [];
            while (stack.length) {
                const n = stack.pop();
                if (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "COMPONENT_SET") {
                    frames.push(n.id);
                }
                if (n.children) stack.push(...n.children);
            }
            targets = frames;
        }
        if (!targets.length) {
            return NextResponse.json({ images: [], message: "No target nodes found." });
        }

        // Batch to avoid overly long URLs (chunk size ~ 40)
        const chunkSize = 40;
        const chunks: string[][] = [];
        for (let i = 0; i < targets.length; i += chunkSize) {
            chunks.push(targets.slice(i, i + chunkSize));
        }

        const collected: { nodeId: string, remoteUrl: string, storagePath?: string }[] = [];

        for (const ids of chunks) {
            const url =
                `${FIGMA_API}/images/${fileKey}` +
                `?ids=${encodeURIComponent(ids.join(","))}` +
                `&format=${format}&scale=${scale}`;
            const imgResp = await fetch(url, { headers: { "X-Figma-Token": token } });
            if (!imgResp.ok) {
                const t = await imgResp.text();
                return NextResponse.json({ error: `Images fetch failed: ${t}` }, { status: 502 });
            }
            const imgJson = await imgResp.json();
            for (const id of ids) {
                const remoteUrl = imgJson.images[id];
                if (remoteUrl) {
                    collected.push({ nodeId: id, remoteUrl});
                }
            }
        }

        // Initialize Supabase only if uploading
        // TODO: to be implemented

        return NextResponse.json({
            count: collected.length,
            nodes: collected,
            uploaded: upload,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
    }
}