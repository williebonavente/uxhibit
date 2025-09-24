"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                    p-6 sm:p-8 md:p-10 bg-[#1E1E1E]/40 
                    backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
      {success ? (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Image
            src="/images/your-creativity-is-out-in-the-world.svg"
            alt="Password reset success illustration"
            width={150}
            height={150}
            className="object-contain mb-6"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#ED5E20] mb-4">
            Password Changed
          </h2>
          <p className="mb-2 text-sm sm:text-base md:text-lg text-gray-500 dark:text-[#F5F5F5]/70">
            Your password has been updated successfully. You can now log in with your new credentials.
          </p>
          <div className="flex items-center gap-2 text-[#ED5E20] text-sm">
            <Loader2 className="animate-spin w-5 h-5" />
            Redirecting 
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="w-full space-y-5">
          <div className="flex justify-center">
            <Image
              src="/images/reset-password.svg"
              alt="Reset password illustration"
              width={150}
              height={150}
              className="object-contain mb-6"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-4">
            Set New Password
          </h2>
          <p className="mb-8 text-sm sm:text-base md:text-lg text-center text-gray-500 dark:text-[#F5F5F5]/70">
            Enter your new password below to reset your account.
          </p>
          <div className="grid gap-2">
            <PasswordInput
              id="password"
              type="password"
              placeholder="Enter new password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-accent"
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <PasswordInput
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-accent"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
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
              {isLoading ? "Saving..." : "Set New Password"}
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
      )}
    </div>
  );
}