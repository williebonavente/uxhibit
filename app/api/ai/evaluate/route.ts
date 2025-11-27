import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { evaluateFrames } from "@/lib/ai/evaluateFrames";
import { saveDesignVersion } from "@/lib/ai/saveDesignVersion";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      method,
      url,
      frames,
      designId,
      versionId,
      snapshot,
      meta,
    }: {
      method?: "link" | "file" | string;
      url?: string;
      frames?: Record<string, string>;
      designId?: string;
      versionId?: string;
      snapshot?: any;
      meta?: { file_key?: string; node_id?: string; thumbnail_url?: string };
    } = body || {};

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) console.log("[AI Evaluate] Supabase auth error:", authError);

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!designId) {
      return NextResponse.json({ error: "Missing designId" }, { status: 400 });
    }

    // Normalize/Infer method
    const rawMethod = typeof method === "string" ? method.toLowerCase().trim() : undefined;
    const fileAliases = new Set(["file", "upload", "files"]);
    const linkAliases = new Set(["link", "url", "figma"]);
    const hasFrames = !!frames && Object.keys(frames || {}).length > 0;
    const hasUrl = !!(url && url.trim());

    let resolvedMethod: "file" | "link" | null = null;
    if (rawMethod && fileAliases.has(rawMethod)) resolvedMethod = "file";
    else if (rawMethod && linkAliases.has(rawMethod)) resolvedMethod = "link";
    else if (hasFrames) resolvedMethod = "file";
    else if (hasUrl) resolvedMethod = "link";

    if (!resolvedMethod) {
      return NextResponse.json(
        { error: "Invalid request. Provide frames (file) or url (link)." },
        { status: 400 }
      );
    }

    const fileKey = meta?.file_key;
    const nodeId = meta?.node_id;
    let finalThumbnailUrl = meta?.thumbnail_url || undefined;

    // progress row
    try {
      await supabase.from("frame_evaluation_progress").insert({
        job_id: versionId,
        progress: 0,
        status: "started",
        user_id: user.id,
        created_at: new Date().toISOString(),
      });
    } catch (progressErr) {
      console.error("[AI Evaluate] Failed to insert progress:", progressErr);
    }

        // FILE path
    if (resolvedMethod === "file") {
      // validate frames
      const entries = Object.entries(frames || {});
      if (entries.length === 0) {
        return NextResponse.json({ error: "No frames provided" }, { status: 400 });
      }

      // store data URLs to storage, collect public URLs
      const bucket = "figma-frames";
      const frameImages: Record<string, string> = {};
            for (const [frameId, dataUrl] of entries) {
        try {
          const [, base64] = String(dataUrl).split("base64,");
          const bytes = Buffer.from(base64 || "", "base64");
          const path = `${user.id}/${designId}/${frameId}.png`;
          const { error: upErr } = await supabase.storage
            .from(bucket)
            .upload(path, bytes, { contentType: "image/png", upsert: true });
          if (upErr) {
            return NextResponse.json(
              { error: `Failed to store frame ${frameId}: ${upErr.message}` },
              { status: 500 }
            );
          }
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          frameImages[frameId] = data.publicUrl;
        } catch {
          return NextResponse.json(
            { error: `Invalid data URL for frame ${frameId}` },
            { status: 400 }
          );
        }
      }

      if (!finalThumbnailUrl) {
        finalThumbnailUrl = Object.values(frameImages)[0];
      }

      const frameIds = Object.keys(frameImages);

            const { frameResults, total_score, summary } = await evaluateFrames({
        frameIds,
        frameImages,
        user,
        designId,
        fileKey: fileKey || "",
        versionId,
        snapshot,
        authError,
        supabase,
        figmaFileUrl: undefined,
        onProgress: async (current, total) => {
          try {
            await supabase
              .from("frame_evaluation_progress")
              .update({
                progress: Math.round((current / total) * 100),
                status: "processing",
                updated_at: new Date().toISOString(),
              })
              .eq("job_id", versionId);
          } catch (err) {
            console.error("[AI Evaluate] Progress update error:", err);
          }
        },
      });

      try {
        await supabase
          .from("frame_evaluation_progress")
          .update({
            progress: 0,
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", versionId);
      } catch (progressErr) {
        console.error("[AI Evaluate] Final progress update error:", progressErr);
      }

      const saveResult = await saveDesignVersion({
        supabase,
        versionId,
        designId,
        fileKey: fileKey ?? null,
        nodeId: nodeId ?? null,
        thumbnailUrl: finalThumbnailUrl,
        fallbackImageUrl: finalThumbnailUrl,
        summary,
        frameResults,
        total_score,
        snapshot,
        user: user ?? undefined,
      });

      return NextResponse.json({
        status: "processing",
        message: "AI evaluation started (file).",
        frameCount: frameIds.length,
        designId,
        versionId: saveResult.versionId,
      });
    }

    // link method
    if (resolvedMethod === "link"  && !hasUrl) {
      return NextResponse.json({ error: "Missing Figma URL" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const parseRes = await fetch(`${baseUrl}/api/figma/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ url }),
    });
    if (!parseRes.ok) {
      const detail = await parseRes.text();
      return NextResponse.json(
        { error: "Failed to parse Figma file", detail },
        { status: 500 }
      );
    }

    const parseData = await parseRes.json();
    const fileKeyParsed = parseData.fileKey;
    const frameImages = parseData.frameImages || {};
    const frameIds = Object.keys(frameImages);
    if (frameIds.length === 0) {
      return NextResponse.json(
        { error: "No frames found in Figma file", details: parseData },
        { status: 400 }
      );
    }

    if (!finalThumbnailUrl) {
      const { data: designRow } = await supabase
        .from("designs")
        .select("thumbnail_url")
        .eq("id", designId)
        .maybeSingle();
      if (designRow?.thumbnail_url) finalThumbnailUrl = designRow.thumbnail_url;
    }

    const { frameResults, total_score, summary } = await evaluateFrames({
      frameIds,
      frameImages,
      user,
      designId,
      fileKey: fileKeyParsed || "",
      versionId,
      snapshot,
      authError,
      supabase,
      figmaFileUrl: url,
      onProgress: async (current, total) => {
        try {
          await supabase
            .from("frame_evaluation_progress")
            .update({
              progress: Math.round((current / total) * 100),
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("job_id", versionId);
        } catch (err) {
          console.error("[AI Evaluate] Progress update error:", err);
        }
      },
    });

    try {
      await supabase
        .from("frame_evaluation_progress")
        .update({
          progress: 100,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", versionId);
    } catch (err) {
      console.error("[AI Evaluate] Final progress update error:", err);
    }

    const saveResult = await saveDesignVersion({
      supabase,
      versionId,
      designId,
      fileKey: fileKeyParsed,
      nodeId,
      thumbnailUrl: finalThumbnailUrl,
      fallbackImageUrl: finalThumbnailUrl,
      summary,
      frameResults,
      total_score,
      snapshot,
      user: user ?? undefined,
    });

    return NextResponse.json({
      status: "processing",
      message: "AI evaluation started (link).",
      frameCount: frameIds.length,
      designId,
      versionId: saveResult.versionId,
    });
  } catch (e: any) {
    console.error("[/api/ai/evaluate] error", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}