"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteAccountPage({
    open,
    setOpen,
    userId,
    email
}: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    userId: string | undefined;
    email: string | undefined;
}) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Only render the dialog if open is true
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            {/* Centered Delete Account Card */}
            <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                      p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-white/20 text-center">
                {/* Logo */}
                <div className="flex justify-center">
                    <Image
                        src="/images/let-go-of-this-design.svg"
                        alt="Delete account illustration"
                        width={150}
                        height={150}
                        className="object-contain mb-6"
                    />
                </div>
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-4">
                    Delete Account
                </h2>
                {/* Subtitle */}
                <p className="mb-6 text-sm sm:text-base md:text-lg text-center text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
                    Are you sure you want to delete your account? This action cannot be undone.<br />
                    Please enter your password to confirm.
                </p>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsDeleting(true);
                        try {
                            const res = await fetch("/api/delete_user", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId, password, email }),
                            });
                            if (res.ok) {
                                toast.success("Account deleted.");
                                router.push("/auth/login");
                            } else {
                                const data = await res.json();
                                toast.error(data?.error || "Failed to delete account.");
                            }
                        } catch (err) {
                            toast.error(`Failed to delete account. ${err}`);
                        } finally {
                            setIsDeleting(false);
                        }
                    }}
                    className="space-y-4"
                >
                    <PasswordInput
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="mb-2 h-12 text-lg"
                        disabled={isDeleting}
                    />
                    <div className="flex flex-col-2 gap-5 mt-6 h-12">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isDeleting}
                            className={`w-1/2 ${isDeleting ? "cursor-not-allowed" : "cursor-pointer"} inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
                                        border border-neutral-300/70 dark:border-neutral-600/60 
                                        bg-white/60 dark:bg-neutral-800/50
                                        text-neutral-700 dark:text-neutral-200
                                        shadow-sm backdrop-blur
                                        hover:bg-white/80 dark:hover:bg-neutral-800/70
                                        hover:border-neutral-400 dark:hover:border-neutral-500
                                        transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                                        focus:ring-offset-white dark:focus:ring- cursor-pointer h-full` }
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!password || isDeleting}
                            className={`group relative inline-flex items-center justify-center
                                w-1/2 px-9 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                                transition-all duration-300 h-full
                                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                                ${(!password || isDeleting) ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
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
                            {!isDeleting && (
                                <span
                                    aria-hidden
                                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                                >
                                    <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                                bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                                transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                                </span>
                            )}

                            {/* Border ring */}
                            <span
                                aria-hidden
                                className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
                            />

                            {/* Label */}
                            <span className="relative z-10 flex items-center gap-2">
                                {isDeleting ? "Deleting..." : "Delete"}
                            </span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}