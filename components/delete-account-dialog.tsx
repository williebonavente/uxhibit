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
  email,
  authProvider, // "password" | "figma" | other oauth providers
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  userId: string | undefined;
  email: string | undefined;
  authProvider?: "password" | "figma" | string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Only render the dialog if open is true
  if (!open) return null;

  const isPasswordUser = (authProvider ?? "password") === "password";
  const deleteDisabled =
    isDeleting ||
    (isPasswordUser ? !password : confirmText.trim().toUpperCase() !== "DELETE");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={() => setOpen(false)} // close when background is clicked
    >
      {/* Centered Delete Account Card */}
      <div
        className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg 
                      p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-white/20 text-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
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
          Are you sure you want to delete your account?
          <br />
          {isPasswordUser ? (
            <span className="text-xs">
              This action cannot be undone. Please enter your password to
              confirm.
            </span>
          ) : (
            <span className="text-xs">
              This action cannot be undone. Type DELETE to confirm.
            </span>
          )}
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!userId) {
              toast.error("Missing user id.");
              return;
            }
            if (isPasswordUser && !password) {
              toast.error("Please enter your password.");
              return;
            }
            if (!isPasswordUser && confirmText.trim().toUpperCase() !== "DELETE") {
              toast.error('Type "DELETE" to confirm.');
              return;
            }

            setIsDeleting(true);
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
              const res = await fetch(`${baseUrl}/api/delete_user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  email,
                  authProvider: authProvider ?? "password",
                  // include password only for local accounts
                  password: isPasswordUser ? password : undefined,
                  // explicit confirmation for OAuth accounts
                  confirm: !isPasswordUser ? "DELETE" : undefined,
                }),
              });
              if (res.ok) {
                toast.success("Account deleted.");
                router.push("/auth/login");
              } else {
                const data = await res.json().catch(() => null);
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
          {isPasswordUser ? (
            <PasswordInput
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2 h-12 text-lg"
              disabled={isDeleting}
            />
          ) : (
            <>
              <input
                type="text"
                placeholder='Type "DELETE" to confirm'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full mb-2 h-12 text-lg rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3"
                disabled={isDeleting}
              />
            </>
          )}

          <div className="flex gap-5 mt-6 h-12 w-full">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium
                                        border border-neutral-300/70 dark:border-neutral-600/60 cursor-pointer
                                        bg-white/60 dark:bg-neutral-800/50 h-full
                                        text-neutral-700 dark:text-neutral-200
                                        shadow-sm backdrop-blur
                                        hover:bg-white/80 dark:hover:bg-neutral-800/70
                                        hover:border-neutral-400 dark:hover:border-neutral-500
                                        transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED5E20]/60
                                        focus:ring-offset-white dark:focus:ring-offset-[#1A1A1A]"
            >
              Cancel
            </Button>

            {/* Delete Button */}
            <Button
              type="submit"
              disabled={deleteDisabled}
              className={`group relative flex-1 inline-flex items-center justify-center
                                        rounded-xl text-sm text-white font-semibold tracking-wide
                                        transition-all duration-300 h-full overflow-hidden
                                        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 ${deleteDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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