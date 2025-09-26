"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

type DesignChatProps = {
    designId: string;
    currentUserId: string | null;
};

type Message = {
    id: string;
    design_id: string;
    user_id: string;
    message: string;
    created_at: string;
    seen_by: string[];
};

type UserProfile = {
    avatar_url: string;
    name: string;
};

export default function DesignChat({ designId, currentUserId }: DesignChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editInput, setEditInput] = useState("");
    const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const prevMessagesLength = useRef(0);

    // Find the latest message (from current user) that has been seen by someone else
    const latestSeenMsgId = (() => {
        const seenMsgs = messages
            .filter(
                msg =>
                    msg.user_id === currentUserId &&
                    msg.seen_by &&
                    msg.seen_by.filter(uid => uid !== currentUserId).length > 0
            );
        if (seenMsgs.length === 0) return null;
        return seenMsgs[seenMsgs.length - 1].id;
    })();

    useEffect(() => {
        const supabase = createClient();
        async function fetchMessagesAndProfiles() {
            // 1. Fetch messages
            const { data: msgs } = await supabase
                .from("design_chats")
                .select("id, design_id, user_id, message, created_at, seen_by")
                .eq("design_id", designId)
                .order("created_at", { ascending: true });
            setMessages(msgs || []);

            // 2. Gather all unique user IDs from senders and seen_by
            const senderUserIds = (msgs || []).map(msg => msg.user_id);
            const seenUserIds = (msgs || []).flatMap(msg => (msg.seen_by || []));
            const allUserIds = Array.from(new Set([...senderUserIds, ...seenUserIds]));

            // 3. Fetch user profiles for those IDs
            if (allUserIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, avatar_url, full_name")
                    .in("id", allUserIds);
                const map: Record<string, UserProfile> = {};
                (profiles || []).forEach(p => {
                    map[p.id] = { avatar_url: p.avatar_url, name: p.full_name };
                });
                setUserProfiles(map);
            } else {
                setUserProfiles({});
            }

            console.log("Fetching profiles for Ids: ", allUserIds);
        }

        fetchMessagesAndProfiles();
        const channel = supabase
            .channel("design-chat")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "design_chats"
                    // <-- No filter here!
                },
                (payload) => {
                    // console.error(payload);
                    const newRow = payload.new as Message | null;
                    const oldRow = payload.old as Message | null;
                    if (
                        (newRow && newRow.design_id === designId) ||
                        (oldRow && oldRow.design_id === designId)
                    ) {
                        setTimeout(() => {
                            fetchMessagesAndProfiles();
                        }, 100); // 100ms delay
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [designId]);

    useEffect(() => {
        if (!currentUserId) return; 

        if (messages.length > prevMessagesLength.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
        prevMessagesLength.current = messages.length;

        async function markSeen() {
            const supabase = createClient();
            const unseen = messages.filter(
                (msg) =>
                    msg.user_id !== currentUserId &&
                    currentUserId &&
                    (!msg.seen_by || !msg.seen_by.includes(currentUserId))
            );

            if (unseen.length === 0) return;

            for (const msg of unseen) {
                const newSeenBy = Array.from(new Set([...(msg.seen_by || []), currentUserId]));
                const { error } = await supabase
                    .from("design_chats")
                    .update({ seen_by: newSeenBy })
                    .eq("id", msg.id);
                if (error) {
                    console.error("Failed to update seen_by for", msg.id, error.message);
                }
            }
        }

        if (messages.length > 0) markSeen();
    }, [messages, currentUserId]);

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;
        const supabase = createClient();
        await supabase.from("design_chats").insert({
            design_id: designId,
            user_id: currentUserId,
            message: input.trim(),
            seen_by: [],
        });
        setInput("");
    }

    async function startEdit(msg: Message) {
        setEditingId(msg.id);
        setEditInput(msg.message);
    }

    async function saveEdit(msg: Message) {
        const supabase = createClient();
        await supabase.from("design_chats")
            .update({ message: editInput })
            .eq("id", msg.id);
        setEditingId(null);
        setEditInput("");
    }

    async function deleteMsg(msg: Message) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        const supabase = createClient();
        await supabase.from("design_chats")
            .delete()
            .eq("id", msg.id);
    }

    return (
        <div className="border rounded p-3 bg-white max-w-md mx-auto mt-4">
            <div className="h-96 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
                {messages.map((msg) => {
                    return (
                        <div
                            key={msg.id}
                            className={`mb-1 flex ${msg.user_id === currentUserId ? "justify-end" : "justify-start"}`}
                        >
                            {/* Always show sender's avatar */}
                            {userProfiles[msg.user_id]?.avatar_url ? (
                                <Image
                                    src={userProfiles[msg.user_id].avatar_url}
                                    alt={userProfiles[msg.user_id].name || "User"}
                                    className="w-7 h-7 rounded-full border border-gray-200 mr-2"
                                    width={28}
                                    height={28}
                                />
                            ) : (
                                <span
                                    className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs mr-2"
                                    title={userProfiles[msg.user_id]?.name || "User"}
                                >
                                    {userProfiles[msg.user_id]?.name?.[0] || "?"}
                                </span>
                            )}
                            <div className="flex flex-col items-end max-w-xs">
                                <div className="flex items-center">
                                    {editingId === msg.id ? (
                                        <>
                                            <input
                                                className="border rounded px-2 py-1 mr-1"
                                                value={editInput}
                                                onChange={e => setEditInput(e.target.value)}
                                            />
                                            <button
                                                className="text-green-600 mr-1"
                                                onClick={() => saveEdit(msg)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="text-gray-400"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-block px-2 py-1 rounded bg-orange-100">
                                                {msg.message}
                                            </span>
                                            {msg.user_id === currentUserId && (
                                                <>
                                                    <button
                                                        className="ml-2 text-xs text-blue-500"
                                                        onClick={() => startEdit(msg)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="ml-1 text-xs text-red-500"
                                                        onClick={() => deleteMsg(msg)}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center">
                                    {new Date(msg.created_at).toLocaleTimeString()}
                                    {msg.user_id === currentUserId && msg.id === latestSeenMsgId && (
                                        <span className="ml-2 flex items-center gap-1">
                                            <span className="font-semibold text-gray-500">Seen by</span>
                                            {msg.seen_by && msg.seen_by.filter(uid => uid !== currentUserId).length > 0 ? (
                                                (() => {
                                                    const seenByOthers = msg.seen_by.filter(uid => uid !== currentUserId);
                                                    const lastUid = seenByOthers[seenByOthers.length - 1];
                                                    return userProfiles[lastUid]?.avatar_url ? (
                                                        <Image
                                                            key={lastUid}
                                                            src={userProfiles[lastUid].avatar_url}
                                                            alt={userProfiles[lastUid].name || "User"}
                                                            className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer animate-fadeIn"
                                                            title={userProfiles[lastUid].name}
                                                            width={20}
                                                            height={20}
                                                        />
                                                    ) : (
                                                        <span
                                                            key={lastUid}
                                                            className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs cursor-pointer animate-fadeIn"
                                                            title={userProfiles[lastUid]?.name || "User"}
                                                        >
                                                            {userProfiles[lastUid]?.name?.[0] || "?"}
                                                        </span>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-gray-400 ml-1">No one yet</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    className="flex-1 border rounded px-2 py-1"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button
                    className="bg-orange-500 text-white px-3 py-1 rounded"
                    type="submit"
                >
                    Send
                </button>
            </form>
        </div>
    );
}