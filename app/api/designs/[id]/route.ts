import { createClient } from "@/utils/supabase/client";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id } = params;
    const { data, error } = await supabase
        .from("design_versions")
        .select("*")
        .eq("design_id", id)
        .order("version", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ versions: data });
}

export async function POST(req: Request, { params }: Params) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    try {
        const { id } = params;
        const { owner_id, file_key, node_id, thumbnail_url, snapshot, ai } = await req.json();

        // find next version
        const { data: maxRows, error: mErr } = await supabase
            .from("design_versions")
            .select("version")
            .eq("design_id", id)
            .order("version", { ascending: false })
            .limit(1);
        if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
        const next = (maxRows?.[0]?.version ?? 0) + 1;

        const { data: ver, error: vErr } = await supabase
            .from("design_versions")
            .insert({
                design_id: id,
                version: next,
                file_key,
                node_id,
                thumbnail_url,
                snapshot: snapshot ?? null,
                ai_summary: ai?.summary ?? null,
                ai_data: ai ?? null,
                created_by: owner_id,
            })
            .select("*")
            .single();
        if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

        await supabase.from("designs").update({ current_version_id: ver.id }).eq("id", id);

        return NextResponse.json({ version: ver });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
    }
}