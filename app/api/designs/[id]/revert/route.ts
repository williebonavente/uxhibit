import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type Params = { params: { id: string } };

// Body: { version_id: string } OR { version: number }
export async function POST(req: Request, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: user } = supabase.auth.getUser();
        const { id } = params;
        const body = await req.json();

        let targetId: string | null = body.version_id ?? null;

        if (!targetId && typeof body.version === "number") {
            const { data: v, error } = await supabase
                .from("design_versions")
                .select("id")
                .eq("design_id", id)
                .eq("version", body.version)
                .single();
            if (error) return NextResponse.json({ error: error.message }, { status: 400 });
            targetId = v?.id ?? null;
        }

        if (!targetId) return NextResponse.json({ error: "version_id or version required" }, { status: 400 });

        const { error: uErr } = await supabase
            .from("designs")
            .update({ current_version_id: targetId })
            .eq("id", id);
        if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

        return NextResponse.json({ ok: true, current_version_id: targetId });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
    }
}