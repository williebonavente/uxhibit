import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Auto-refreshes the signed URL every `refreshMinutes` minutes.
 */
export default function useSignedThumbnail(thumbnailPath?: string | null, refreshMinutes = 55) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!thumbnailPath) {
      setSignedUrl(null);
      return;
    }

    // If already a public url, return as-is
    if (thumbnailPath.startsWith("http")) {
      setSignedUrl(thumbnailPath);
      return;
    }

    const supabase = createClient();
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
      try {
        const { data } = await supabase.storage
          .from("design-thumbnails")
          .createSignedUrl(thumbnailPath, 3600);
        if (!mounted) return;
        setSignedUrl(data?.signedUrl ?? null);
      } catch (err) {
        console.error("[useSignedThumbnail] createSignedUrl error", err);
      }
    };

    // initial fetch + interval
    refresh();
    intervalId = setInterval(refresh, Math.max(1, refreshMinutes) * 60 * 1000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [thumbnailPath, refreshMinutes]);

  return signedUrl;
}