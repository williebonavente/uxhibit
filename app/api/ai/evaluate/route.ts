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
      image_only,
      forceImageOnly,
      skipFigma,
    }: {
      method?: "link" | "file" | string;
      url?: string;
      frames?: Record<string, string>;
      designId?: string;
      versionId?: string;
      snapshot?: any;
      meta?: { file_key?: string; node_id?: string; thumbnail_url?: string };
      image_only?: boolean;
      forceImageOnly?: boolean;
      skipFigma?: boolean;
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

    // Normalize inputs
    const rawMethod = typeof method === "string" ? method.toLowerCase().trim() : undefined;
    const cleanedUrl = typeof url === "string" ? url.trim() : "";
    const fileKey = meta?.file_key?.trim();
    const nodeId = meta?.node_id?.trim();
    let finalThumbnailUrl = meta?.thumbnail_url || undefined;

    // Build a Figma URL if only file_key (+node_id) is provided
    const derivedFigmaUrl =
      fileKey && fileKey.length > 0
        ? `https://www.figma.com/file/${fileKey}${nodeId ? `?node-id=${encodeURIComponent(nodeId)}` : ""}`
        : "";

    const fileAliases = new Set(["file", "upload", "files"]);
    const imageAliases = new Set(["image", "img", "picture", "single"]);
    const linkAliases = new Set(["link", "url", "figma"]);
    const hasFrames = !!frames && Object.keys(frames || {}).length > 0;
    const hasAnyLinkish = !!(cleanedUrl || derivedFigmaUrl);
    const forceImage = !!(image_only || forceImageOnly || skipFigma);

    let resolvedMethod: "file" | "link" | "image" | null = null;
    if (rawMethod && fileAliases.has(rawMethod)) resolvedMethod = "file";
    else if (rawMethod && linkAliases.has(rawMethod)) resolvedMethod = "link";
    else if (rawMethod && imageAliases.has(rawMethod)) resolvedMethod = "image";
    else if (hasFrames) resolvedMethod = "file";
    else if (hasAnyLinkish) resolvedMethod = "link";

    if (forceImage) resolvedMethod = "image";

    // If "link" but URL is not a Figma URL, treat as image
    const effectiveUrl = cleanedUrl || derivedFigmaUrl;
    if (resolvedMethod === "link" && effectiveUrl && !/figma\.com/i.test(effectiveUrl)) {
      resolvedMethod = "image";
    }

    if (!resolvedMethod) {
      return NextResponse.json(
        { error: "Invalid request. Provide frames (file), a Figma url/file_key (link), or an image." },
        { status: 400 }
      );
    }

    // Prepare a stable version id and create the version row upfront to satisfy FK constraints
    const vId = versionId && versionId.trim().length > 0 ? versionId.trim() : crypto.randomUUID();

    // Choose initial thumbnail
    const initialThumbnail = finalThumbnailUrl || cleanedUrl || derivedFigmaUrl || undefined;

    // Create/Upsert design_version BEFORE any frame inserts
    await saveDesignVersion({
      supabase,
      versionId: vId,
      designId,
      fileKey: resolvedMethod === "link" ? (fileKey ?? null) : null,
      nodeId: resolvedMethod === "link" ? (nodeId ?? null) : null,
      thumbnailUrl: initialThumbnail,
      fallbackImageUrl: initialThumbnail,
      summary: null,
      frameResults: [],
      total_score: null,
      snapshot,
      user: user ?? undefined,
    });

    // Insert progress row with vId
    try {
      await supabase.from("frame_evaluation_progress").upsert(
        {
          job_id: vId,
          progress: 0,
          status: "started",
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "job_id" }
      );
    } catch (progressErr) {
      console.error("[AI Evaluate] Progress upsert error:", progressErr);
    }

    // IMAGE and FILE methods – NEVER use file_key/node_id; NEVER call Figma parser
    if (resolvedMethod === "image" || resolvedMethod === "file") {
      const frameImages: Record<string, string> = {};

      if (resolvedMethod === "file") {
        const frameMap = frames || {};
        const bucket = "figma-frames";
        for (const [frameId, dataUrl] of Object.entries(frameMap)) {
          if (/^https?:\/\//i.test(dataUrl)) {
            frameImages[frameId] = dataUrl;
            continue;
          }
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
      } else {
        // image-only: accept single url or frames map
        if (hasFrames) {
          for (const [fid, img] of Object.entries(frames!)) frameImages[fid] = img;
        } else if (effectiveUrl) {
          frameImages["single"] = effectiveUrl;
        } else {
          return NextResponse.json({ error: "Missing image url" }, { status: 400 });
        }
      }

      if (!finalThumbnailUrl) {
        finalThumbnailUrl = initialThumbnail || Object.values(frameImages)[0];
      }

      const frameIds = Object.keys(frameImages);
      if (frameIds.length === 0) {
        return NextResponse.json({ error: "No image frames provided." }, { status: 400 });
      }

      const { frameResults, total_score, summary } = await evaluateFrames({
        frameIds,
        frameImages,
        user,
        designId,
        fileKey: "", // ensure evaluator doesn't treat this as Figma
        versionId: vId, // IMPORTANT: use pre-created version id
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
              .eq("job_id", vId);
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
          .eq("job_id", vId);
      } catch (progressErr) {
        console.error("[AI Evaluate] Final progress update error:", progressErr);
      }

      const saveResult = await saveDesignVersion({
        supabase,
        versionId: vId,
        designId,
        fileKey: null,
        nodeId: null,
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
        message: `AI evaluation started (${resolvedMethod}).`,
        frameCount: frameIds.length,
        designId,
        versionId: saveResult.versionId ?? vId,
      });
    }

    // LINK method (Figma) – accept either direct URL or derive from file_key
    const figmaUrl = cleanedUrl || derivedFigmaUrl;
    if (!figmaUrl) {
      return NextResponse.json({ error: "Missing Figma URL or file_key" }, { status: 400 });
    }
    if (!/figma\.com/i.test(figmaUrl)) {
      return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const parseRes = await fetch(`${baseUrl}/api/figma/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ url: figmaUrl }),
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
      versionId: vId, // use same pre-created version id
      snapshot,
      authError,
      supabase,
      figmaFileUrl: figmaUrl,
      onProgress: async (current, total) => {
        try {
          await supabase
            .from("frame_evaluation_progress")
            .update({
              progress: Math.round((current / total) * 100),
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("job_id", vId);
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
        .eq("job_id", vId);
    } catch (err) {
      console.error("[AI Evaluate] Final progress update error:", err);
    }

    const saveResult = await saveDesignVersion({
      supabase,
      versionId: vId,
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
      versionId: saveResult.versionId ?? vId,
    });
  } catch (e: any) {
    console.error("[/api/ai/evaluate] error", e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}