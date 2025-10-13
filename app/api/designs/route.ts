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

    console.log("Received design submission:", { title, figma_link, file_key, node_id });

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

    let designId;
    let storedThumbnail = thumbnail_url || null;

    // EXISTING DESIGN
    if (existing?.id) {
      designId = existing.id;
      console.log("Updating existing design:", designId);

      if (thumbnail_url) {
        const up = await uploadThumbnailFromUrl(
          Promise.resolve(supabase),
          thumbnail_url,
          designId,
          { makePublic: false }
        );
        storedThumbnail = up.signedUrl || up.publicUrl || up.path || storedThumbnail;
      }

      const { error: uErr } = await supabase
        .from("designs")
        .update({ thumbnail_url: storedThumbnail })
        .eq("id", designId);
      if (uErr) {
        console.error("Error updating thumbnail:", uErr.message);
        return NextResponse.json({ error: uErr.message }, { status: 400 });
      }
    } else {
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
      if (dErr) {
        console.error("Error creating design:", dErr.message);
        return NextResponse.json({ error: dErr.message }, { status: 400 });
      }
      designId = design.id;
      console.log("Created new design:", designId);

      if (thumbnail_url) {
        const up = await uploadThumbnailFromUrl(
          Promise.resolve(supabase),
          thumbnail_url,
          designId,
          { makePublic: false }
        );
        storedThumbnail = up.signedUrl || up.publicUrl || up.path || storedThumbnail;

        const { error: thumbErr } = await supabase
          .from("designs")
          .update({ thumbnail_url: storedThumbnail })
          .eq("id", designId);
        if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
      }
    }

    // Call AI evaluate if requested
    let aiEvalResult = null;
    if (evaluate) {
      try {
        console.log("Calling AI evaluate for design:", designId);
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
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

        if (aiResponse.ok) {
          aiEvalResult = await aiResponse.json();
          console.log("AI evaluation result:", aiEvalResult);
        } else {
          console.error("AI evaluate failed:", await aiResponse.text());
        }
      } catch (err) {
        console.error('Error calling AI evaluate:', err);
      }
    }

    // Final response
    return NextResponse.json({
      design: {
        id: designId,
        title,
        figma_link,
        thumbnail_url: storedThumbnail,
      },
      existed: !!existing?.id,
      ai_evaluation: aiEvalResult,
      jobId: aiEvalResult?.jobId,
    });
  } catch (e: unknown) {
    console.error("Server error:", e);
    const errorMessage = typeof e === "object" && e !== null && "message" in e
      ? (e as { message?: string }).message
      : "Server error";
    return NextResponse.json({ error: errorMessage || "Server error" }, { status: 500 });
  }
}