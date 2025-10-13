
type UploadOpts = {
    bucket?: string;
    makePublic?: boolean;
    signedExpirySeconds?: number;
}
export async function uploadThumbnailFromUrl(
    supabase: ReturnType<typeof import("@/utils/supabase/server").createClient>,
    publicUrlSource: string,
    designId: string,
    opts: UploadOpts = {}
) {

    const {
        bucket = "design-thumbnails",
        makePublic = false,
        signedExpirySeconds = 31536000,
    } = opts;
    try {
        const r = await fetch(publicUrlSource, { cache: "no-store" });
        if (!r.ok) throw new Error(`Fetch thumbnail failed (${r.status})`);
        const bytes = await r.arrayBuffer();
        const ct = r.headers.get("content-type") || "image/png";

        // Pick extension based on content-type
        let ext = "png";
        if (ct.includes("jpeg")) ext = "jpg";
        else if (ct.includes("webp")) ext = "webp";
        else if (ct.includes("svg")) ext = "svg";

        const path = `${designId}/thumbnail.${ext}`;

        // Upload (remove mistaken await on supabase)
        const { error: upErr } = await (await supabase)
            .storage
            .from("design-thumbnails")
            .upload(path, Buffer.from(bytes), {
                upsert: true,
                contentType: ct,
            });
        if (upErr) throw upErr;

        // Build  URL(s)
        let publicUrl: string | null = null;
        let signedUrl: string | null = null;

        if (makePublic) {
            const { data: pub } = (await supabase).storage.from(bucket).getPublicUrl(path);
            publicUrl = pub.publicUrl;
        } else {
            const { data: signed, error: sErr } = await (await supabase)
                .storage
                .from(bucket)
                .createSignedUrl(path, signedExpirySeconds);
            if (sErr) throw sErr;
            signedUrl = signed.signedUrl;
        }
        return { path, publicUrl, signedUrl };
    } catch (e: any) {
        console.error("uploadThumbnailFromUrl", e.message);
        return { path: null, publicUrl: null, signedUrl: null };
    }
}