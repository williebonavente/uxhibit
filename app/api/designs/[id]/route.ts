import { createClient } from "@/utils/supabase/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fileKey = url.searchParams.get("file_key");
  const supabase = createClient();

  if (!fileKey) {
    return NextResponse.json({ error: "file_key query param required" }, { status: 400 });
  }

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
  const supabase = createClient();
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = (data as any)?.user?.id ?? null;
  } catch (e) {
    // ignore auth errors
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      figma_link,
      file_key,
      node_id,
      thumbnail_url,
      age,
      occupation,
      snapshot,
    } = body || {};

    if (!file_key) {
      return NextResponse.json({ error: "file_key is required" }, { status: 400 });
    }

    // if design exists, return it
    const { data: existing, error: exErr } = await supabase
      .from("designs")
      .select("id, title, current_version_id, file_key, created_by")
      .eq("file_key", file_key)
      .maybeSingle();

    if (exErr) {
      console.error("[api/designs POST] lookup error:", exErr);
      return NextResponse.json({ error: exErr.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ design: existing, version_id: existing.current_version_id ?? null }, { status: 200 });
    }

    // create design + initial version
    const { data: createdDesign, error: createErr } = await supabase
      .from("designs")
      .insert({
        title: title ?? null,
        figma_link: figma_link ?? null,
        file_key,
        node_id: node_id ?? null,
        thumbnail_url: thumbnail_url ?? null,
        age: age ?? null,
        occupation: occupation ?? null,
        snapshot: snapshot ?? null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (createErr) {
      console.error("[api/designs POST] create design error:", createErr);
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    const { data: ver, error: vErr } = await supabase
      .from("design_versions")
      .insert({
        design_id: createdDesign.id,
        version: 1,
        file_key,
        node_id: node_id ?? null,
        thumbnail_url: thumbnail_url ?? null,
        snapshot: snapshot ?? null,
        ai_summary: null,
        ai_data: null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (vErr) {
      console.error("[api/designs POST] create version error:", vErr);
      return NextResponse.json({ design: createdDesign, error: vErr.message }, { status: 201 });
    }

    const { error: updErr } = await supabase
      .from("designs")
      .update({ current_version_id: ver.id })
      .eq("id", createdDesign.id);

    if (updErr) console.error("[api/designs POST] update current_version_id error:", updErr);

    return NextResponse.json({ design: createdDesign, version_id: ver.id }, { status: 201 });
  } catch (e: any) {
    console.error("[api/designs POST] unexpected error:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}