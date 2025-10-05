"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ProfileRoleClient({
    profileId,
    initialRole,
}: {
    profileId: string;
    initialRole: string;
}) {
    const [role, setRole] = useState(initialRole);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id ?? null);
        });
    }, []);

    const isOwner = currentUserId === profileId;

    // Debounced save
    useEffect(() => {
        if (!isOwner) return;
        if (!editing) return;
        if (role === initialRole) return;

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            setSaving(true);
            const supabase = createClient();
            const { error } = await supabase
                .from("profile_details")
                .update({ role })
                .eq("profile_id", profileId);
            setSaving(false);
            if (error) {
                toast.error(`Failed to update role. Please try again. ${error.message}`);
            } else {
                toast.success("Role updated!");
            }
        }, 800);

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, editing]);

    if (!isOwner) {
        return (
            <p className="text-sm sm:text-base text-black/80 truncate max-w-[240px]">
                {role}
            </p>
        );
    }

    return (
        <div
            className="max-w-[240px] group relative"
            onMouseEnter={() => setEditing(true)}
            onMouseLeave={() => setEditing(false)}
        >
            {editing ? (
                <input
                    className="text-sm sm:text-base border rounded px-2 py-1 w-full bg-white"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={saving}
                    aria-label="Edit role"
                    autoFocus
                    onBlur={() => setEditing(false)}
                />
            ) : (
                <p className="text-sm sm:text-base text-black/80 truncate cursor-pointer">
                    {role}
                    <span className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        (edit)
                    </span>
                </p>
            )}
        </div>
    );
}