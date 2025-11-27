import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { uploadThumbnailFromUrl } from "@/lib/uploadThumbnail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fileKey = url.searchParams.get("file_key");
  if (!fileKey) return NextResponse.json({ error: "file_key query param required" }, { status: 400 });

  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("designs")
      .select("id, title, current_version_id, file_key, owner_id")
      .eq("file_key", fileKey)
      .maybeSingle();

    if (error) {
      console.error("[api/designs GET] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ design: data ?? null });
  } catch (e: any) {
    console.error("[api/designs GET] unexpected error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      figma_link,
      file_key,
      node_id,
      thumbnail_url,
      snapshot,
      // CLIENT now triggers evaluation by default
      // Pass "server" to run evaluation here
      evaluate = "client",
      method,
      frames,
    } = body;

    // decide evaluation mode
    const evalMode: "client" | "server" =
      evaluate === "server" || evaluate === true ? "server" : "client";
    const shouldEvalOnServer = evalMode === "server";

    // Check for existing design
    const { data: existing, error: existErr } = await supabase
      .from("designs")
      .select("id,title")
      .eq("owner_id", user.id)
      .eq("figma_link", figma_link)
      .eq("file_key", file_key)
      .maybeSingle();

    if (existErr && existErr.code !== "PGRST116") {
      console.error("Error checking existing design:", existErr.message);
      return NextResponse.json({ error: existErr.message }, { status: 400 });
    }

    let designId: string;
    let storedThumbnail: any = thumbnail_url || null;

    // EXISTING DESIGN
    if (existing?.id) {
      designId = existing.id;

      // upload/normalize thumbnail if provided
      if (thumbnail_url) {
        const up = await uploadThumbnailFromUrl(
          supabase as any,
          thumbnail_url,
          designId,
          { makePublic: false }
        ).catch((e) => {
          console.warn("uploadThumbnailFromUrl failed:", e);
          return null;
        });

        if (up) {
          if (up.signedUrl) storedThumbnail = up.signedUrl;
          else if (up.publicUrl) storedThumbnail = up.publicUrl;
          else if (up.path) storedThumbnail = up.path;

          const { error: thumbErr } = await supabase
            .from("designs")
            .update({ thumbnail_url: storedThumbnail })
            .eq("id", existing.id);
          if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
        }
      }

      // Only trigger evaluation on the server if explicitly requested
      if (shouldEvalOnServer) {
        console.log("Starting AI evaluation (server) for existing design:", designId);
        const evalRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            method: method ?? (frames ? "file" : "link"),
            designId,
            versionId: undefined,
            snapshot,
            url:
              (method ?? (frames ? "file" : "link")) === "link" ? figma_link : undefined,
            frames:
              (method ?? (frames ? "file" : "link")) === "file" ? (frames ?? {}) : undefined,
            meta: {
              file_key,
              node_id,
              thumbnail_url: storedThumbnail,
            },
          }),
        });
        console.log("AI evaluation response status:", evalRes.status);

        if (!evalRes.ok) {
          const detailText = await evalRes.text().catch(() => "");
          let detail: any = detailText;
          try { detail = JSON.parse(detailText); } catch {}
          const msg = detail?.error || detail?.message || "AI evaluation failed";
          return NextResponse.json({ error: msg, detail, designId }, { status: evalRes.status });
        }
      }

      return NextResponse.json({
        design: {
          id: existing.id,
          title: existing.title,
          figma_link,
          thumbnail_url: storedThumbnail,
        },
        existed: true,
        // client should start evaluation when evalMode === "client"
        ai_evaluation: shouldEvalOnServer ? "processing" : "pending",
        eval_mode: evalMode,
      });
    }

    // NEW DESIGN
    const { data: design, error: dErr } = await supabase
      .from("designs")
      .insert({
        owner_id: user.id,
        title,
        figma_link,
        file_key,
        node_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });

    designId = design.id;
    storedThumbnail = thumbnail_url || null;

    if (thumbnail_url) {
      const up = await uploadThumbnailFromUrl(
        supabase as any,
        thumbnail_url,
        design.id,
        { makePublic: false }
      ).catch((e) => {
        console.warn("uploadThumbnailFromUrl failed:", e);
        return null;
      });

      if (up) {
        if (up.signedUrl) storedThumbnail = up.signedUrl;
        else if (up.publicUrl) storedThumbnail = up.publicUrl;
        else if (up.path) storedThumbnail = up.path;

        const { error: thumbErr } = await supabase
          .from("designs")
          .update({ thumbnail_url: storedThumbnail })
          .eq("id", design.id);
        if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
      }
    }

    if (shouldEvalOnServer) {
      console.log("Starting AI evaluation (server) for new design:", designId);
      const evalRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          method: method ?? (frames ? "file" : "link"),
          designId,
          versionId: undefined,
          snapshot,
          url:
            (method ?? (frames ? "file" : "link")) === "link" ? figma_link : undefined,
          frames:
            (method ?? (frames ? "file" : "link")) === "file" ? (frames ?? {}) : undefined,
          meta: {
            file_key,
            node_id,
            thumbnail_url: storedThumbnail,
          },
        }),
      });
      console.log("AI evaluation response status:", evalRes.status);

      if (!evalRes.ok) {
        const detailText = await evalRes.text().catch(() => "");
        let detail: any = detailText;
        try { detail = JSON.parse(detailText); } catch {}
        const msg = detail?.error || detail?.message || "AI evaluation failed";
        return NextResponse.json({ error: msg, detail, designId }, { status: evalRes.status });
      }
    }

    return NextResponse.json({
      design: {
        id: designId,
        title,
        figma_link,
        thumbnail_url: storedThumbnail,
      },
      existed: false,
      ai_evaluation: shouldEvalOnServer ? "processing" : "pending",
      eval_mode: evalMode,
    }, { status: 201 });
  } catch (e: unknown) {
    console.error("Server error:", e);
    const errorMessage =
      typeof e === "object" && e !== null && "message" in e
        ? (e as { message?: string }).message
        : "Server error";
    return NextResponse.json({ error: errorMessage || "Server error" }, { status: 500 });
  }
}