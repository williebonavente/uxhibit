import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const {
      design_id,
      file_key,
      node_id,
      thumbnail_url,
      ai_summary,
      ai_data,
      snapshot,
      created_by,
      total_score
    } = body;

    if (!design_id || !created_by) {
      return NextResponse.json({ error: "Missing design_id or created_by" }, { status: 400 });
    }

    // Get the latest version number for this design
    const { data: latestVersion, error: versionErr } = await supabase
      .from("design_versions")
      .select("version")
      .eq("design_id", design_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (versionErr) {
        console.error(versionErr.message);
    }

    const nextVersion = latestVersion?.version ? latestVersion.version + 1 : 1;

    // Insert new version row
    const { data: newVersion, error: insertErr } = await supabase
      .from("design_versions")
      .insert([{
        design_id,
        version: nextVersion,
        file_key: file_key || null,
        node_id: node_id || null,
        thumbnail_url: thumbnail_url || null,
        ai_summary: ai_summary || null,
        ai_data: ai_data || null,
        snapshot: snapshot || null,
        created_by,
        created_at: new Date().toISOString(),
        total_score: total_score || null,
        status: "pending",
      }])
      .select("id, version")
      .single();

    if (insertErr) {
      console.error("Error creating design_version:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    console.log("Created new design_version:", newVersion.id, "version:", newVersion.version);

    return NextResponse.json({ versionId: newVersion.id, version: newVersion.version }, { status: 200 });
  } catch (e: any) {
    console.error("Server error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}