import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, figma_link, file_key, node_id, thumbnail_url, snapshot, ai } = await req.json();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!figma_link) return NextResponse.json({ error: "figma_link is required" }, { status: 400 });

    // 0) Check if a design with the same figma_link already exists for this user
    const { data: existing, error: existErr } = await supabase
      .from("designs")
      .select("id, title")
      .eq("owner_id", user.id)
      .eq("figma_link", figma_link)
      .maybeSingle();
    if (existErr && existErr.code !== "PGRST116") {
      // PGRST116 = Results contain 0 rows (safe to ignore when using maybeSingle)
      return NextResponse.json({ error: existErr.message }, { status: 400 });
    }

    // Helper: get next version number
    const getNextVersion = async (designId: string) => {
      const { data: rows, error } = await supabase
        .from("design_versions")
        .select("version")
        .eq("design_id", designId)
        .order("version", { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((rows?.[0]?.version as number | undefined) ?? 0) + 1;
    };

    if (existing?.id) {
      // A design for this link already exists -> create a new version only
      const next = await getNextVersion(existing.id);

      const { data: ver, error: vErr } = await supabase
        .from("design_versions")
        .insert({
          design_id: existing.id,
          version: next,
          file_key,
          node_id,
          thumbnail_url,
          snapshot: snapshot ?? null,
          ai_summary: ai?.summary ?? null,
          ai_data: ai ?? null,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

      const { error: uErr } = await supabase
        .from("designs")
        .update({ current_version_id: ver.id })
        .eq("id", existing.id);
      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

      return NextResponse.json({
        design: { id: existing.id, title: existing.title, figma_link },
        current_version: ver,
        existed: true,
      });
    }

    // No existing design -> create a new design and version 1
    const { data: design, error: dErr } = await supabase
      .from("designs")
      .insert({ owner_id: user.id, title, figma_link })
      .select("*")
      .single();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });

    const { data: ver, error: vErr } = await supabase
      .from("design_versions")
      .insert({
        design_id: design.id,
        version: 1,
        file_key,
        node_id,
        thumbnail_url,
        snapshot: snapshot ?? null,
        ai_summary: ai?.summary ?? null,
        ai_data: ai ?? null,
        created_by: user.id,
      })
      .select("*")
      .single();
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

    const { error: uErr } = await supabase
      .from("designs")
      .update({ current_version_id: ver.id })
      .eq("id", design.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

    return NextResponse.json({ design, current_version: ver, existed: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}