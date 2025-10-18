import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import type { Dispatch, SetStateAction } from "react";
import type { Design } from "@/lib/types/designTypes";

export async function syncPublishedStateService(
  design: Design | null,
  setDesign: Dispatch<SetStateAction<Design | null>>
): Promise<void> {
  if (!design?.id) return;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { data: published, error } = await supabase
      .from("published_designs")
      .select("*")
      .eq("design_id", design.id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Failed to sync published state:", error);
      return;
    }

    setDesign((prev) =>
      prev
        ? {
            ...prev,
            is_active: !!published,
            published_version_id: published?.published_version_id || "",
            published_at: published?.published_at || "",
          }
        : prev
    );
  } catch (err) {
    console.error("syncPublishedStateService error:", err);
  }
}

export async function publishProjectService(
  design: Design | null,
  setDesign?: Dispatch<SetStateAction<Design | null>>
): Promise<boolean> {
  if (!design?.id) {
    toast.error("Missing design to publish.");
    return false;
  }

  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      toast.error("User not authenticated.");
      return false;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("published_designs")
      .select("*")
      .eq("design_id", design.id)
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      toast.error("Failed to check publish status.");
      console.error("publishProjectService fetchError:", fetchError);
      return false;
    }

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("published_designs")
        .update({
          is_active: true,
          published_at: new Date().toISOString(),
          published_version_id: design.current_version_id,
        })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("published_designs")
        .insert({
          design_id: design.id,
          user_id: userId,
          published_version_id: design.current_version_id,
          published_at: new Date().toISOString(),
          is_active: true,
        }));
    }

    if (!error) {
      toast.success("Design published to the community!");
      // optimistically update design state if setter provided
      if (setDesign) {
        setDesign((prev) => (prev ? { ...prev, is_active: true, published_version_id: design.current_version_id, published_at: new Date().toISOString() } : prev));
      }
      return true;
    } else {
      toast.error(`Failed to publish design: ${error.message || "Unknown error"}`);
      console.error("publishProjectService error:", error);
      return false;
    }
  } catch (err) {
    console.error("publishProjectService exception:", err);
    toast.error("Failed to publish design.");
    return false;
  }
}

export async function unpublishProjectService(
  design: Design | null,
  setDesign?: Dispatch<SetStateAction<Design | null>>
): Promise<boolean> {
  if (!design?.id) {
    toast.error("Missing design to unpublish.");
    return false;
  }

  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      toast.error("User not authenticated.");
      return false;
    }

    const { error } = await supabase
      .from("published_designs")
      .update({ is_active: false })
      .eq("design_id", design.id)
      .eq("user_id", userId);

    if (!error) {
      if (setDesign) setDesign((prev) => (prev ? { ...prev, is_active: false } : prev));
      toast.success("Design unpublished!");
      return true;
    } else {
      toast.error(`Failed to unpublish design: ${error.message || "Unknown error"}`);
      console.error("unpublishProjectService error:", error);
      return false;
    }
  } catch (err) {
    console.error("unpublishProjectService exception:", err);
    toast.error("Failed to unpublish design.");
    return false;
  }
}