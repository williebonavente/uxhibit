import { createClient } from "@/utils/supabase/client";

/**
 * Fetch comments for a design and mark unread comments as read for the current user.
 * Returns an array of root comments (each with .replies array).
 */
export async function openCommentsForDesign(designId?: string, currentUserId?: string | null) {
  if (!designId) return [];

  const supabase = createClient();

  // mark as read (best-effort)
  if (currentUserId) {
    try {
      await supabase
        .from("comments")
        .update({ is_read: true })
        .eq("design_id", designId)
        .eq("user_id", currentUserId)
        .eq("is_read", false);
    } catch (err) {
      console.error("[openCommentsForDesign] mark read failed", err);
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .select(`
      id, text, user_id, created_at, local_time, 
      is_read, parent_id, updated_at, design_id,
      profiles:profiles!comments_user_id_fkey (
        first_name, middle_name, last_name, avatar_url
      )
    `)
    .eq("design_id", designId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[openCommentsForDesign] fetch failed", error);
    throw error;
  }

  const mappedComments = (data || []).map((comment: any) => ({
    id: comment.id,
    text: comment.text,
    user: {
      id: comment.user_id,
      fullName:
        [comment.profiles?.first_name, comment.profiles?.middle_name, comment.profiles?.last_name]
          .filter(Boolean)
          .join(" ") || "",
      avatarUrl: comment.profiles?.avatar_url || "",
    },
    replies: [] as any[],
    parentId: comment.parent_id,
    createdAt: new Date(comment.created_at),
    updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
    localTime: comment.local_time,
    design_id: comment.design_id,
    is_read: comment.is_read,
  }));

  const commentMap: Record<string, any> = {};
  mappedComments.forEach(c => (commentMap[c.id] = { ...c, replies: [] }));

  const rootComments: any[] = [];
  mappedComments.forEach(c => {
    if (c.parentId) {
      if (commentMap[c.parentId]) commentMap[c.parentId].replies.push(commentMap[c.id]);
    } else {
      rootComments.push(commentMap[c.id]);
    }
  });

  return rootComments;
}