// import { NextResponse } from "next/server";
// import { createClient } from '@/utils/supabase/server';
// import { uploadThumbnailFromUrl } from "@/lib/uploadThumbnail";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient();
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = await req.json();
//     const { title, figma_link, file_key, node_id, thumbnail_url, snapshot, ai } = body;

//     if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
//     if (!figma_link) return NextResponse.json({ error: "figma_link is required" }, { status: 400 });

//     const { data: existing, error: existErr } = await supabase
//       .from("designs")
//       .select("id,title")
//       .eq("owner_id", user.id)
//       .eq("figma_link", figma_link)
//       .eq("file_key", file_key)
//       .maybeSingle();
//     if (existErr && existErr.code !== "PGRST116")
//       return NextResponse.json({ error: existErr.message }, { status: 400 });

//     const getNextVersion = async (designId: string) => {
//       const { data: rows, error } = await supabase
//         .from("design_versions")
//         .select("version")
//         .eq("design_id", designId)
//         .order("version", { ascending: false })
//         .limit(1);
//       if (error) throw error;
//       return ((rows?.[0]?.version as number | undefined) ?? 0) + 1;
//     };

//     // EXISTING DESIGN -> add version
//     if (existing?.id) {
//       let storedThumbnail = thumbnail_url || null;
//       if (thumbnail_url) {
//         const up = await uploadThumbnailFromUrl(
//           // TODO: Fix the any with defined type
//           supabase as any,
//             thumbnail_url,
//             existing.id,
//             { makePublic: false } 
//         );
//         if (up.publicUrl) storedThumbnail = up.publicUrl; else if (up.path) storedThumbnail = up.path;

//       }

//       // Re-Upload
//             const next = await getNextVersion(existing.id);
//       // WATCH: AI evaluation 
//       let aiResult = null;
//       try {
//         const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json'},
//           body: JSON.stringify({
//             fileKey: file_key,
//             nodeId: node_id,
//             imageUrl: thumbnail_url,
//             designId: existing.id
//           })
//         });

//         if (aiResponse.ok) {
//           aiResult = await aiResponse.json();
//         }
//       } catch (err) {
//         console.error('Error calling AI evaluate: ', err); 
//       }

//       const { data: ver, error: vErr } = await supabase
//         .from("design_versions")
//         .insert({
//           design_id: existing.id,
//           version: next,
//           file_key,
//           node_id,
//           thumbnail_url: storedThumbnail,      // no thumbnail_path
//           snapshot: snapshot ?? null,
//           ai_summary: aiResult?.summary ?? null,
//           ai_data: aiResult ?? null,
//           created_by: user.id,
//         })
//         .select("*")
//         .single();
//       if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

//       const { error: uErr } = await supabase
//         .from("designs")
//         .update({
//           current_version_id: ver.id,
//           thumbnail_url: storedThumbnail,
//         })
//         .eq("id", existing.id);
//       if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

//       return NextResponse.json({
//         design: {
//           id: existing.id,
//           title: existing.title,
//           figma_link,
//           thumbnail_url: storedThumbnail,
//         },
//         current_version: ver,
//         existed: true,
//       });
//     }

//     // NEW DESIGN
//     const { data: design, error: dErr } = await supabase
//       .from("designs")
//       .insert({ owner_id: user.id, title, figma_link, file_key })
//       .select("*")
//       .single();
//     if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });

//     let storedThumbnail = thumbnail_url || null;
//     if (thumbnail_url) {
//       const up = await uploadThumbnailFromUrl(
//         supabase as any,
//         thumbnail_url,
//         design.id,
//         { makePublic: false }
//       );
//       if (up.publicUrl) storedThumbnail = up.publicUrl; else if (up.path) storedThumbnail = up.path;
//     }

//     const { data: ver, error: vErr } = await supabase
//       .from("design_versions")
//       .insert({
//         design_id: design.id,
//         version: 1,
//         file_key,
//         node_id,
//         thumbnail_url: storedThumbnail,
//         snapshot: snapshot ?? null,
//         ai_summary: ai?.summary ?? null,
//         ai_data: ai ?? null,
//         created_by: user.id,
//       })
//       .select("*")
//       .single();
//     if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

//     const { error: uErr } = await supabase
//       .from("designs")
//       .update({
//         current_version_id: ver.id,
//         thumbnail_url: storedThumbnail,
//       })
//       .eq("id", design.id);
//     if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

//     return NextResponse.json({
//       design: { ...design, thumbnail_url: storedThumbnail },
//       current_version: ver,
//       existed: false,
//     });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';
import { uploadThumbnailFromUrl } from "@/lib/uploadThumbnail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, figma_link, file_key, node_id, thumbnail_url, snapshot, ai, evaluate = true } = body;

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!figma_link) return NextResponse.json({ error: "figma_link is required" }, { status: 400 });

    const { data: existing, error: existErr } = await supabase
      .from("designs")
      .select("id,title")
      .eq("owner_id", user.id)
      .eq("figma_link", figma_link)
      .eq("file_key", file_key)
      .maybeSingle();
    if (existErr && existErr.code !== "PGRST116")
      return NextResponse.json({ error: existErr.message }, { status: 400 });

    // EXISTING DESIGN
    if (existing?.id) {
      let storedThumbnail = thumbnail_url || null;
      if (thumbnail_url) {
        const up = await uploadThumbnailFromUrl(
          supabase as any,
          thumbnail_url,
          existing.id,
          { makePublic: false }
        );
        if (up.publicUrl) storedThumbnail = up.publicUrl; else if (up.path) storedThumbnail = up.path;
      }

      // Just update the thumbnail, don't mess with versions
      const { error: uErr } = await supabase
        .from("designs")
        .update({
          thumbnail_url: storedThumbnail,
        })
        .eq("id", existing.id);
      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

      // Call AI evaluate if requested
      let aiEvalResult = null;
      if (evaluate) {
        try {
          const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
              fileKey: file_key,
              nodeId: node_id,
              imageUrl: thumbnail_url,
              designId: existing.id,
              snapshot
            })
          });

          if (aiResponse.ok) {
            aiEvalResult = await aiResponse.json();
          }
        } catch (err) {
          console.error('Error calling AI evaluate: ', err);
        }
      }

      // Let the caller know this design already exists
      return NextResponse.json({
        design: {
          id: existing.id,
          title: existing.title,
          figma_link,
          thumbnail_url: storedThumbnail,
        },
        existed: true,
        ai_evaluation: aiEvalResult,
      });
    }

    // NEW DESIGN - Just create the design without version
    const { data: design, error: dErr } = await supabase
      .from("designs")
      .insert({
        owner_id: user.id,
        title,
        figma_link,
        file_key,
        node_id,  // Include node_id directly
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 400 });

    // Handle thumbnail upload for new design
    let storedThumbnail = thumbnail_url || null;
    if (thumbnail_url) {
      const up = await uploadThumbnailFromUrl(
        supabase as any,
        thumbnail_url,
        design.id,
        { makePublic: false }
      );
      if (up.publicUrl) storedThumbnail = up.publicUrl; else if (up.path) storedThumbnail = up.path;

      // Update the design with the thumbnail URL
      const { error: thumbErr } = await supabase
        .from("designs")
        .update({ thumbnail_url: storedThumbnail })
        .eq("id", design.id);
      if (thumbErr) console.error("Error updating thumbnail:", thumbErr);
    }

    // Call AI evaluate for new design
    let aiEvalResult = null;
    if (evaluate) {
      try {
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({
            fileKey: file_key,
            nodeId: node_id,
            imageUrl: storedThumbnail || thumbnail_url,
            designId: design.id,
            snapshot
          })
        });

        if (aiResponse.ok) {
          aiEvalResult = await aiResponse.json();
        }
      } catch (err) {
        console.error('Error calling AI evaluate: ', err);
      }
    }

    // Return the design with AI evaluation results
    return NextResponse.json({
      design: { ...design, thumbnail_url: storedThumbnail },
      existed: false,
      ai_evaluation: aiEvalResult
    });
  } catch (e: any) {
    console.error("Server error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}