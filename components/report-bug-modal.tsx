import { useEffect, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

type User = {
    avatarUrl: string;
    fullName: string;
};

export function ReportBugModal({
    open,
    onClose,
    user,
}: {
    open: boolean;
    onClose: () => void;
    user: User | null;
}) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Replace with your repo path
    const GITHUB_ISSUE_URL = "https://github.com/williebonavente/uxhibit/issues/new";

    // Disable background scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setTimeout(() => {
                modalRef.current?.querySelector("input")?.focus();
            }, 100);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Trap focus inside modal
    useEffect(() => {
        if (!open) return;
        const handleTab = (e: KeyboardEvent) => {
            const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
                'input, textarea, button'
            );
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleTab);
        return () => document.removeEventListener("keydown", handleTab);
    }, [open, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams({
            title,
            body,
            labels: "bug"
        });
        window.open(`${GITHUB_ISSUE_URL}?${params.toString()}`, "_blank", "noopener,noreferrer");
        setTitle("");
        setBody("");
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
        }, 1800);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Blurred, darkened background */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Centered form */}
            <div
                ref={modalRef}
                className="relative z-[201] bg-white dark:bg-[#141414] rounded-xl shadow-lg w-full max-w-md sm:max-w-lg p-6 sm:p-8 overflow-y-auto max-h-[90vh] flex flex-col items-center"
            >
                {/* User avatar and header */}
                <div className="flex flex-col items-center w-full mb-4">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        {user && (
                            <Image
                                src={user.avatarUrl}
                                alt={user.fullName}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 shadow-md ring-2 ring-blue-200 hover:scale-105 hover:ring-blue-500 transition-transform duration-200"
                                title={user.fullName}
                            />
                        )}
                        <FaGithub className="text-3xl text-gray-700 dark:text-gray-200" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-center w-full">
                        Report a Bug or Request a Feature
                    </h2>
                </div>
                {/* Divider */}
                <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-600 mb-6" />
                {submitted ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <span className="text-green-600 text-2xl mb-2">✔️</span>
                        <p className="text-center font-semibold">
                            Thank you! Redirecting you to GitHub...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                        <div className="flex flex-col gap-1">
                            <input
                                className="border rounded px-3 py-2 w-full text-2xl font-bold focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-150 focus:border-blue-500 hover:border-blue-400"
                                placeholder="Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <textarea
                                className="border rounded px-3 py-2 w-full min-h-[80px] text-base focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-150 focus:border-blue-500 hover:border-blue-400"
                                placeholder="Describe the bug or feature request..."
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button
                                type="button"
                                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all duration-150 hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 cursor-pointer"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded bg-blue-600 text-white flex items-center gap-2 shadow transition-all duration-150 hover:bg-blue-700 active:scale-95 ${!title.trim() || !body.trim()
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                                disabled={!title.trim() || !body.trim()}
                                title="Submit directly to GitHub Issues"
                            >
                                <FaGithub /> Submit to GitHub
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <style>{`
                .backdrop-blur-sm {
                    backdrop-filter: blur(8px);
                }
            `}</style>
        </div>
    );
}