import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { uploadThumbnailFromUrl } from "@/lib/uploadThumbnail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, figma_link, file_key, node_id, thumbnail_url, snapshot, evaluate = true } = body;

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
      let thumbnailPromise: Promise<any> = Promise.resolve(null);
      if (thumbnail_url) {
        thumbnailPromise = uploadThumbnailFromUrl(
          supabase as any,
          thumbnail_url,
          designId,
          { makePublic: false }
        );
      }

      const up = await thumbnailPromise;
      if (up) {
        if (up.signedUrl) storedThumbnail = up.signedUrl;
        else if (up.publicUrl) storedThumbnail = up.publicUrl;
        else if (up.path) storedThumbnail = up.path;

        // Update the design with the thumbnail URL
        const { error: thumbErr } = await supabase
          .from("designs")
          .update({ thumbnail_url: storedThumbnail })
          .eq("id", existing.id);
        if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
      }

      // Start AI evaluation synchronously
      if (evaluate) {
        console.log("Starting AI evaluation for existing design:", designId);
        const evalRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: req.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            url: figma_link,
            designId: existing.id,
            nodeId: node_id,
            thumbnail_url: storedThumbnail,
            snapshot
          })
        });
        console.log("AI evaluation response status:", evalRes.status);
        if (!evalRes.ok) {
          const detail = await evalRes.text();
          console.error("AI evaluation failed:", detail);
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
        ai_evaluation: "processing",
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
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });

    designId = design.id;
    storedThumbnail = thumbnail_url || null;
    let thumbnailPromise: Promise<any> = Promise.resolve(null);
    if (thumbnail_url) {
      thumbnailPromise = uploadThumbnailFromUrl(
        supabase as any,
        thumbnail_url,
        design.id,
        { makePublic: false }
      );
    }

    const up = await thumbnailPromise;
    if (up) {
      if (up.signedUrl) storedThumbnail = up.signedUrl;
      else if (up.publicUrl) storedThumbnail = up.publicUrl;
      else if (up.path) storedThumbnail = up.path;

      // Update the design with the thumbnail URL
      const { error: thumbErr } = await supabase
        .from("designs")
        .update({ thumbnail_url: storedThumbnail })
        .eq("id", design.id);
      if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
    }

    // Start AI evaluation synchronously
    if (evaluate) {
      console.log("Starting AI evaluation for new design:", designId);
      const evalRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          url: figma_link,
          designId,
          nodeId: node_id,
          thumbnail_url: storedThumbnail,
          snapshot
        })
      });
      console.log("AI evaluation response status:", evalRes.status);
      if (!evalRes.ok) {
        const detail = await evalRes.text();
        console.error("AI evaluation failed:", detail);
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
      ai_evaluation: "processing",
    });
  } catch (e: unknown) {
    console.error("Server error:", e);
    const errorMessage = typeof e === "object" && e !== null && "message" in e
      ? (e as { message?: string }).message
      : "Server error";
    return NextResponse.json({ error: errorMessage || "Server error" }, { status: 500 });
  }
}