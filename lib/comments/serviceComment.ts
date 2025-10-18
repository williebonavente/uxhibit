import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { buildCommentTree } from "./utilsComment";


export async function fetchCommentsForDesign(designId?: string) {
    if (!designId) return [];
    const supabase = createClient();
    const { data, error } = await supabase
        .from("comments")
        .select(`
      id, text, user_id, created_at, local_time, parent_id, updated_at, design_id, is_read,
      profiles:profiles!comments_user_id_fkey (
        first_name, middle_name, last_name, avatar_url
      )
    `)
        .eq("design_id", designId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[fetchCommentsForDesign] supabase error", error);
        toast?.error?.(`Failed to fetch comments: ${error.message || error}`);
        throw error;
    }

    // normalize profiles (supabase may return relation as an array)
    const normalized = (data || []).map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return { ...row, profiles: profile ?? null };
    });

    return buildCommentTree(normalized);
}

export async function fetchCommentWithProfile(commentId?: string) {
    if (!commentId) return null;
    const supabase = createClient();
    const { data, error } = await supabase
        .from("comments")
        .select(`
      id, text, user_id, created_at, local_time, parent_id, updated_at, design_id, is_read,
      profiles:profiles!comments_user_id_fkey (
        first_name, middle_name, last_name, avatar_url
      )
    `)
        .eq("id", commentId)
        .single();

    if (error) {
        console.error("[fetchCommentWithProfile] error", error);
        return null;
    }
    if (!data) {
        console.warn("[fetchCommentWithProfile] no data for id", commentId);
        return null;
    }

    // normalize profile (handle array vs object)
    const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

    const fullName = [profile?.first_name, profile?.middle_name, profile?.last_name]
        .filter(Boolean)
        .join(" ") || "";

    const avatarUrl: string | null = profile?.avatar_url ?? null;

    return {
        id: data.id,
        text: data.text,
        user: {
            id: data.user_id,
            fullName,
            avatarUrl,
        },
        replies: [],
        parentId: data.parent_id ?? null,
        createdAt: data.created_at ? new Date(data.created_at) : undefined,
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        localTime: data.local_time ?? null,
        design_id: data.design_id ?? null,
        is_read: !!data.is_read,
    };
}

export async function addComment({
    userId,
    designId,
    text,
    parentId = null,
}: {
    userId?: string | null;
    designId?: string | null;
    text: string;
    parentId?: string | null;
}) {
    if (!userId || !designId || !text.trim()) {
        throw new Error("Missing required fields for addComment");
    }
    const supabase = createClient();
    const { data, error } = await supabase
        .from("comments")
        .insert([
            {
                user_id: userId,
                design_id: designId,
                text,
                parent_id: parentId,
                local_time: new Date().toLocaleTimeString(),
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("[addComment] error", error);
        toast?.error?.(`Failed to add comment: ${error.message || error}`);
        throw error;
    }

    return data;
}

export async function deleteComment(commentId?: string) {
    if (!commentId) throw new Error("Missing commentId");
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
        console.error("[deleteComment] error", error);
        toast?.error?.(`Failed to delete comment: ${error.message || error}`);
        throw error;
    }
    return true;
}

export async function markCommentsRead(designId?: string, userId?: string) {
    if (!designId || !userId) return;
    const supabase = createClient();
    try {
        await supabase
            .from("comments")
            .update({ is_read: true })
            .eq("design_id", designId)
            .eq("user_id", userId)
            .eq("is_read", false);
    } catch (err) {
        console.error("[markCommentsRead] error", err);
    }
}