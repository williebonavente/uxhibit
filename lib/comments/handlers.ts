import type { Design } from "@/lib/types/designTypes";
import { addComment, deleteComment, fetchCommentsForDesign } from "./serviceComment";
import { deleteCommentTree } from "./utilsComment";

/**
 * Create comment handlers bound to the provided dependencies (state/setters).
 */
export function createCommentHandlers(options: {
    design: Design | null;
    currentUserId: string | null;
    newCommentText: string;
    setNewCommentText: (t: string) => void;
    setComments: (cb: any) => void;
    setPostingComment: (b: boolean) => void;
}) {
    const { design, currentUserId, newCommentText, setNewCommentText, setComments, setPostingComment } = options;

    async function handleAddComment(text?: any) {
        // normalize possible inputs:
        // - direct string
        // - React event (event.target.value)
        // - number => convert to string
        // otherwise treat as empty
        const raw = text ?? newCommentText ?? "";
        let body = "";

        if (typeof raw === "string") {
            body = raw.trim();
        } else if (raw && typeof raw === "object" && "target" in raw && typeof raw.target?.value === "string") {
            body = raw.target.value.trim();
        } else if (typeof raw === "number") {
            body = String(raw).trim();
        } else {
            // not a usable input
            body = "";
        }

        if (!currentUserId || !design || !body) return;
        setPostingComment(true);
        try {
            await addComment({ userId: currentUserId, designId: design.id, text: body, parentId: null });
            setNewCommentText("");
            const tree = await fetchCommentsForDesign(design.id);
            setComments(tree);
        } catch (err) {
            console.error("[handleAddComment]", err);
        } finally {
            setPostingComment(false);
        }
    }

    async function handleAddReply(parentId: string, replyText: string) {
        const body = (replyText || "").trim();
        if (!currentUserId || !design || !body) return;
        setPostingComment(true);
        try {
            await addComment({ userId: currentUserId, designId: design.id, text: body, parentId });
            const tree = await fetchCommentsForDesign(design.id);
            setComments(tree);
        } catch (err) {
            console.error("[handleAddReply]", err);
        } finally {
            setPostingComment(false);
        }
    }

    async function handleDeleteComment(id: string) {
        if (!id) return;
        try {
            // optimistic local update
            setComments((prev: any) => deleteCommentTree(prev, id));
            await deleteComment(id);
            if (design?.id) {
                const tree = await fetchCommentsForDesign(design.id);
                setComments(tree);
            }
        } catch (err) {
            console.error("[handleDeleteComment]", err);
            if (design?.id) fetchCommentsForDesign(design.id).then(setComments).catch(() => { });
        }
    }

    return { handleAddComment, handleAddReply, handleDeleteComment };
}