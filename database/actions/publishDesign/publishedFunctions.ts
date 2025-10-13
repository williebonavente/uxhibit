import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


type Design = {
    id: string;
    project_name: string;
    fileKey?: string;
    nodeId?: string;
    imageUrl: string;
    thumbnail?: string;
    thumbnailPath?: string;
    snapshot: string;
    current_version_id: string;
    // Add other properties as needed
};

export async function publishProject(design: {
    id: string;
    current_version_id: string;
}) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { error } = await supabase
        .from("published_designs")
        .insert({
            design_id: design?.id,
            user_id: userId,
            published_version_id: design?.current_version_id,
            published_at: new Date().toISOString(),
        });
    if (!error) {
        toast.success("Design published to the community!");
        return true;
    } else {
        toast.error(`Failed to publish design: ${error.message || "Unknown error"}`);
        return false;
    }

}

export async function unpublishProject(designId: string) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { error } = await supabase
        .from("published_designs")
        .delete()
        .eq("design_id", designId)
        .eq("user_id", userId);

    if (!error) {
        toast.success("Design unpublished!");
        // Let the caller update UI state if needed
        return true;
    } else {
        toast.error(`Failed to unpublish design: ${error.message || "Unknown error"}`);
        return false;
    }
}