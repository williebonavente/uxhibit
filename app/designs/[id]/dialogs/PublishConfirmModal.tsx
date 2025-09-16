import React from "react";

interface PublishConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    mode?: "publish" | "unpublish";
}

const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    mode = "publish", // default to unpublish
}) => {
    if (!open) return null;
    const isPublish = mode === "publish";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#232323] rounded-xl shadow-xl p-8 w-full max-w-md relative">
                <button
                    className="absolute top-3 right-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-[#333] transition cursor-pointer"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
                <div className="flex flex-col items-center">
                    <div className="mb-4">
                        {isPublish ? (
                            <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="12" fill="#ED5E20" fillOpacity="0.15" />
                                <path d="M7 12l3 3 7-7" stroke="#ED5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="12" fill="#6B7280" fillOpacity="0.15" />
                                <path d="M7 7l10 10M17 7l-10 10" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-center">
                        {isPublish ? "Ready to Publish?" : "Unpublish Project?"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                        {isPublish
                            ? "Are you sure you want to publish this project? It will be visible to others, just like sharing a post on social media."
                            : "Are you sure you want to unpublish this project? It will no longer be visible to others."}
                    </p>
                    <div className="flex gap-4 w-full">
                        <button
                            className="flex-1 py-2 rounded bg-gray-200 dark:bg-[#333] cursor-pointer
                            text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-[#444] transition"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className={`flex-1 py-2 rounded font-semibold transition cursor-pointer ${isPublish
                                    ? "bg-gradient-to-r from-[#ED5E20] to-orange-400 text-white hover:from-orange-500 hover:to-[#ED5E20]"
                                    : "bg-gray-400 text-white hover:bg-gray-500"
                                }`}
                            onClick={onConfirm}
                        >
                            {isPublish ? "Publish" : "Unpublish"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublishConfirmModal;