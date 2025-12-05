"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Profile } from "./nav-user";

export function AccountInfoModal({
  open,
  setOpen,
  profile,
  setProfile,
  email,
  setFullName,
  setAvatarUrl,
  getProfile,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  email: string | null;
  setFullName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  getProfile: () => void;
}) {
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  const [birthdayDisplay, setBirthdayDisplay] = useState(
  profile?.birthday ? format(new Date(profile.birthday), "MM/dd/yyyy") : ""
);

useEffect(() => {
  setBirthdayDisplay(
    profile?.birthday ? format(new Date(profile.birthday), "MM/dd/yyyy") : ""
  );
}, [profile?.birthday]);
  const router = useRouter();

  function generateUsername(profile: Profile) {
    const fullName = [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join("");
    return fullName.toLowerCase();
  }

  useEffect(() => {
    async function fetchSignedUrl() {
      if (profile?.avatar_url && !profile.avatar_url.startsWith("http")) {
        const supabase = createClient();
        const { data } = await supabase.storage
          .from("avatars")
          .createSignedUrl(profile.avatar_url, 3600 * 3600);
        if (data?.signedUrl) {
          setSignedAvatarUrl(data.signedUrl);
        } else {
          setSignedAvatarUrl(null);
        }
      } else {
        setSignedAvatarUrl(profile?.avatar_url ?? null);
      }
    }
    fetchSignedUrl();
  }, [profile?.avatar_url]);

  if (!open) return null;

  const fullName = [
    profile?.first_name,
    profile?.middle_name,
    profile?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setOpen(false)}
      />

      {/* Centered form */}
      <div
        className="relative z-[102] bg-white dark:bg-[#141414] rounded-2xl shadow-2xl
                 w-full max-w-2xl mx-auto border border-gray-200/50 dark:border-gray-800/50
                 p-6 sm:p-8 overflow-y-auto max-h-[90vh] transition-all duration-200"
      >
        <h2 className="text-2xl font-bold mb-2 text-center gradient-text">
          Account Information
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          View and update your personal information.
        </p>

        {profile && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const supabase = createClient();
              let imageUrl = profile.avatar_url;

              if (pendingAvatar) {
                const filePath = `${profile.id}/${Date.now()}-${
                  pendingAvatar.name
                }`;
                const { error: uploadError } = await supabase.storage
                  .from("avatars")
                  .upload(filePath, pendingAvatar, {
                    cacheControl: "31536000",
                    upsert: true,
                  });
                if (uploadError) {
                  toast.error(uploadError.message);
                  return;
                }
                // Generate signed URL after upload
                const { data } = await supabase.storage
                  .from("avatars")
                  .createSignedUrl(filePath, 3600 * 3600);
                imageUrl = data?.signedUrl ?? filePath;
              }

              let username = profile.username;
              if (!username && fullName) {
                username = generateUsername(profile);
              }
              // Update profile in DB
              const { error } = await supabase
                .from("profiles")
                .update({
                  username,
                  first_name: profile.first_name,
                  middle_name: profile.middle_name,
                  last_name: profile.last_name,
                  avatar_url: imageUrl,
                  bio: profile.bio,
                  birthday: profile.birthday,
                  gender: profile.gender,
                })
                .eq("id", profile.id);
              const { error: roleError } = await supabase
                .from("profile_details")
                .update({
                  role: profile.role,
                })
                .eq("profile_id", profile.id);
              if (!error && !roleError) {
                toast.success("Profile Updated!");
                setFullName(fullName);
                setAvatarUrl(imageUrl ?? null);
                setOpen(false);
                router.refresh();
                getProfile();
                setPendingAvatar(null);
                setAvatarPreview(null);
                if (imageUrl && !imageUrl.startsWith("http")) {
                  const { data } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(imageUrl, 3600 * 3600);
                  setSignedAvatarUrl(data?.signedUrl ?? null);
                }
              } else {
                toast.error("Failed to update profile");
              }
            }}
            className="space-y-5"
          >
            {/* Avatar section */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative cursor-pointer group"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
              >
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-5 border-white/75 hover:border-[#ED5E20] transition duration-300 shadow-md">
                  <AvatarImage
                    src={avatarPreview ?? signedAvatarUrl ?? undefined}
                    alt={fullName ?? email ?? "User"}
                  />
                  <AvatarFallback className="rounded-full text-4xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {[
                      profile.first_name,
                      profile.middle_name,
                      profile.last_name,
                    ]
                      .filter(Boolean)
                      .map((n) => (n ?? "")[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition rounded-full">
                  <span className="text-white text-sm font-medium">Change</span>
                </div>
              </div>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setPendingAvatar(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* Input fields */}
            <div className="flex flex-col gap-5">
              <div className="">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <Input
                  className="h-10"
                  value={profile.bio ?? ""}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Tell something about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <Input
                  className="h-10"
                  value={profile.first_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, first_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Middle Name
                </label>
                <Input
                  className="h-10"
                  value={profile.middle_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, middle_name: e.target.value })
                  }
                  placeholder="(optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <Input
                  className="h-10"
                  value={profile.last_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, last_name: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2 cursor-not-allowed">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  value={email ?? "Cannot fetch user email"}
                  disabled
                  className="h-10 bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <Input
                    className="h-10"
                    value={profile.username ?? ""}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <Input
                    className="h-10"
                    value={profile.role ?? ""}
                    onChange={(e) =>
                      setProfile({ ...profile, role: e.target.value })
                    }
                    placeholder="Your role"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <Input
  className="h-10"
  value={profile.gender?.trim() || ""}
  onChange={(e) => {
    const raw = e.target.value;

    // 1) Remove anything not A–Z or space (strips emojis/symbols/digits/punct.)
    let sanitized = raw.replace(/[^A-Za-z\s]/g, "");

    // 2) Collapse multiple spaces → single space
    sanitized = sanitized.replace(/\s+/g, " ");

    // 3) Trim ends
    sanitized = sanitized.trim();

    // 4) Optional: cap length to avoid excessively long input
    sanitized = sanitized.slice(0, 40);

    // 5) Optional: Title Case (comment out if you want raw case)
    sanitized = sanitized
      .toLowerCase()
      .replace(/\b[a-z]/g, (c) => c.toUpperCase());

    setProfile({ ...profile, gender: sanitized });
  }}
  placeholder="Specify your gender"
/> 
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Birthday
                  </label>
                                    <Input
                    placeholder="MM/DD/YYYY"
                    value={birthdayDisplay}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = raw.replace(/[^\d]/g, "").slice(0, 8);
                  
                      // Progressive display as MM/DD/YYYY
                      const nextDisplay =
                        digits.length <= 2
                          ? digits
                          : digits.length <= 4
                          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                          : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                      setBirthdayDisplay(nextDisplay);
                  
                      // If 8 digits and valid, update ISO in profile immediately
                      if (digits.length === 8) {
                        const mm = digits.slice(0, 2);
                        const dd = digits.slice(2, 4);
                        const yyyy = digits.slice(4, 8);
                        const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
                  
                        const valid =
                          Number(mm) >= 1 &&
                          Number(mm) <= 12 &&
                          !Number.isNaN(dt.getTime()) &&
                          Number(yyyy) >= 1900 &&
                          dt <= new Date();
                  
                        if (valid) {
                          setProfile({ ...profile, birthday: `${yyyy}-${mm}-${dd}` });
                        } else {
                          // Keep profile.birthday unchanged until valid
                        }
                      }
                    }}
                    onBlur={() => {
                      // Coerce display into ISO on blur; clear if invalid
                      const digits = birthdayDisplay.replace(/[^\d]/g, "").slice(0, 8);
                      if (digits.length === 8) {
                        const mm = digits.slice(0, 2);
                        const dd = digits.slice(2, 4);
                        const yyyy = digits.slice(4, 8);
                        const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
                        const valid =
                          Number(mm) >= 1 &&
                          Number(mm) <= 12 &&
                          !Number.isNaN(dt.getTime()) &&
                          Number(yyyy) >= 1900 &&
                          dt <= new Date();
                  
                        if (valid) {
                          setProfile({ ...profile, birthday: `${yyyy}-${mm}-${dd}` });
                          setBirthdayDisplay(`${mm}/${dd}/${yyyy}`);
                          return;
                        }
                      }
                      // Invalid or incomplete — clear
                      setProfile({ ...profile, birthday: "" });
                      setBirthdayDisplay("");
                    }}
                    className="h-10 bg-white dark:bg-[#141414]"
                  />
                </div>
              </div>
            </div>
            {/* Footer */}
            <footer className="flex flex-col sm:flex-row gap-4 mt-10">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium border border-neutral-300/70 dark:border-neutral-600/60 bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 shadow-sm backdrop-blur hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors h-12 cursor-pointer"
              >
                Cancel
              </button>

              {/* Save Button */}
              <button
                type="submit"
                className="relative flex-1 inline-flex items-center justify-center rounded-xl text-sm text-white font-semibold tracking-wide transition-all duration-300 h-12 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40 cursor-pointer group/button"
              >
                {/* Gradient background */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b] transition-transform duration-300 group-hover:scale-105"
                />

                {/* Glass effect overlay */}
                <span
                  aria-hidden
                  className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                />

                {/* Light sweep animation */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover/button:translate-x-[220%] group-hover/button:opacity-70"
                />

                <span className="relative z-10 font-semibold">Save All</span>
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
