import React from "react";
import Image from "next/image";

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
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onClose} // close when background is clicked
        >
            {/* Card */}
            <div
                className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                            p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A] 
                            rounded-2xl shadow-xl border border-white/20 text-center cursor-default"
                onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
            >
                {/* Icon */}
                <div className="flex justify-center">
                    {isPublish ? (
                        <Image 
                            src="/images/publish-design.svg" 
                            alt="Publish design illustration"
                            width={150}
                            height={150}
                            className="object-contain mb-6"
                        />
                    ) : (
                        <Image 
                            src="/images/unpublish-design.svg" 
                            alt="Unpublish design illustration"
                            width={150}
                            height={150}
                            className="object-contain mb-6"
                        />
                    )}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-4">
                    {isPublish ? "Ready to Publish?" : "Unpublish Project?"}
                </h2>

                {/* Subtitle */}
                <p className="mb-6 text-base md:text-lg text-center leading-relaxed text-gray-700 dark:text-gray-300">
                    {isPublish ? (
                        <>
                            Are you sure you want to publish this project?{" "}
                            <br />
                            <span className="text-xs">It will be visible to others, just like sharing a post on social media.</span>
                        </>
                    ) : (
                        <>
                            Are you sure you want to unpublish this project?{" "}
                            <br />
                            <span className="text-xs">It will no longer be visible to others.</span>
                        </>
                    )}
                </p>

                {/* Buttons */}
                <div className="flex flex-col-2 gap-5 mt-6 h-12">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-1/2 inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                     border border-neutral-300/70 dark:border-neutral-600/60 
                     bg-white/60 dark:bg-neutral-800/50
                     text-neutral-700 dark:text-neutral-200
                     shadow-sm backdrop-blur
                     hover:bg-white/80 dark:hover:bg-neutral-800/70
                     hover:border-neutral-400 dark:hover:border-neutral-500
                     transition-colors
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                     focus:ring-offset-white dark:focus:ring-offset-[#1A1A1A] cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`group relative inline-flex items-center justify-center
                      w-1/2 px-9 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                      transition-all duration-300 h-full cursor-pointer
                      focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                      ${isPublish ? "" : "bg-gray-400 hover:bg-gray-500 cursor-pointer"}`}
                    >
                        {isPublish ? (
                            <>
                                {/* Glow / gradient base */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                                />

                                {/* Inner glass layer */}
                                <span
                                    aria-hidden
                                    className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]"
                                />

                                {/* Animated sheen */}
                                <span
                                    aria-hidden
                                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                >
                                    <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                                 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                </span>

                                {/* Border ring */}
                                <span
                                    aria-hidden
                                    className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
                                />

                                {/* Label */}
                                <span className="relative z-10 flex items-center gap-2">
                                    Publish
                                </span>
                            </>
                        ) : (
                            <span className="relative z-10">Unpublish</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublishConfirmModal;