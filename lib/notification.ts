import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type Notification = {
    id: string;
    type: "heart" | "comment";
    design_id: string;
    from_user_id: string;
    created_at: string;
    designs?: { title?: string };
    from_user?: {full_name?: string};
    // Add more fields as needed
};

export function useDesignNotifications(currentUserId: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!currentUserId) return;

        const supabase = createClient();

        // Listen for new heart events
        const heartChannel = supabase
            .channel("design-likes-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "design_likes",
                },
                async (payload) => {
                    const { data: design } = await supabase
                        .from("designs")
                        .select("owner_id")
                        .eq("id", payload.new.design_id)
                        .single();

                    if (design?.owner_id === currentUserId && payload.new.user_id !== currentUserId) {
                        setNotifications((prev) => [
                            {
                                id: payload.new.id,
                                type: "heart",
                                design_id: payload.new.design_id,
                                from_user_id: payload.new.user_id,
                                created_at: payload.new.created_at,
                            },
                            ...prev,
                        ]);
                    }
                }
            )
            .subscribe();

        // Listen for new comment events
        const commentChannel = supabase
            .channel("design-comments-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "comments",
                },
                async (payload) => {
                    const { data: design } = await supabase
                        .from("designs")
                        .select("owner_id")
                        .eq("id", payload.new.design_id)
                        .single();

                    if (design?.owner_id === currentUserId && payload.new.user_id !== currentUserId) {
                        setNotifications((prev) => [
                            {
                                id: payload.new.id,
                                type: "comment",
                                design_id: payload.new.design_id,
                                from_user_id: payload.new.user_id,
                                created_at: payload.new.created_at,
                            },
                            ...prev,
                        ]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(heartChannel);
            supabase.removeChannel(commentChannel);
        };
    }, [currentUserId]);

    return notifications;
}