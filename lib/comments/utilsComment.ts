export type RawCommentRow = any;

export function buildCommentTree(rows: RawCommentRow[]) {
  const mapped = (rows || []).map((comment: any) => ({
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

  const map: Record<string, any> = {};
  mapped.forEach(c => (map[c.id] = { ...c, replies: [] }));

  const roots: any[] = [];
  mapped.forEach(c => {
    if (c.parentId) {
      if (map[c.parentId]) map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

export function updateCommentTree(comments: any[], updated: any): any[] {
  return comments.map(comment => {
    if (comment.id === updated.id) return { ...comment, ...updated };
    return {
      ...comment,
      replies: comment.replies ? updateCommentTree(comment.replies, updated) : [],
    };
  });
}

export function deleteCommentTree(comments: any[], idToDelete: string): any[] {
  return comments
    .filter(c => c.id !== idToDelete)
    .map(c => ({
      ...c,
      replies: c.replies ? deleteCommentTree(c.replies, idToDelete) : [],
    }));
}