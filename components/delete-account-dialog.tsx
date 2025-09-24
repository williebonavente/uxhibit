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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            {/* Centered Delete Account Card */}
            <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                      p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1E1E1E]/40 
                      backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 text-center">
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
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#ED5E20] mb-4">
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
                    <div className="flex flex-col gap-2 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isDeleting}
                            className={`w-full ${isDeleting ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={`w-full bg-[#ED5E20] text-white hover:bg-[#d44e0f] dark:bg-[#d44e0f] dark:text-white dark:hover:bg-[#ED5E20] ${(!password || isDeleting) ? "cursor-not-allowed" : "cursor-pointer"}`}
                            disabled={!password || isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}