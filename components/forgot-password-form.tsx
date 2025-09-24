"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                    p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1E1E1E]/40 
                    backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
            {success ? (
                <div className="flex flex-col items-center gap-4">
                    {/* Email sent illustration */}
                    <Image
                        src="/images/email-sent.svg"
                        alt="Email sent illustration"
                        width={150}
                        height={150}
                        className="object-contain mb-6"
                    />
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#ED5E20] mb-4">
                        Email Sent
                    </h2>
                    <p className="mb-8 text-sm sm:text-base md:text-lg text-center text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
                        We&rsquo;ve sent you a link to reset your password. Please check your email.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
                    >
                        Back to Log In
                    </Link>
                </div>
            ) : (
                <>
                    {/* Logo */}
                    <div className="flex justify-center">
                        <Image
                            src="/images/reset-password.svg"
                            alt="Reset password illustration"
                            width={150}
                            height={150}
                            className="object-contain mb-6"
                        />
                    </div>
                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#ED5E20] mb-4">
                        Forgot Password
                    </h2>
                    {/* Subtitle */}
                    <p className="mb-8 text-sm sm:text-base md:text-lg text-center text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
                        Enter your email to get a reset link.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative inline-flex items-center justify-center
                        w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                        transition-all duration-300 cursor-pointer
                        text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                        hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                        active:scale-[.97] focus:outline-none
                        focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                        disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                            <span aria-hidden className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]" />
                            <span aria-hidden className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]" />
                            <span aria-hidden className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl">
                                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                            </span>
                            <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50" />
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading && (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                )}
                                {isLoading ? "Sending..." : "Send Email"}
                            </span>
                        </Button>
                        <div className="mt-5 text-center text-sm text-[#1E1E1E]/60 dark:text-[#F5F5F5]/40">
                            <Link
                                href="/auth/login"
                                className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
                            >
                                Back to Log In
                            </Link>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}