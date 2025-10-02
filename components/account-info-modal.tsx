"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  profile: any;
  setProfile: (profile: any) => void;
  email: string | null;
  setFullName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  getProfile: () => void;
}) {
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

  const router = useRouter();

  function generateUsername(profile: any) {
    const name = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join("");
    return name.toLowerCase();
  }

  useEffect(() => {
    async function fetchSignedUrl() {
      if (profile?.avatar_url && !profile.avatar_url.startsWith("http")) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("avatars")
          .createSignedUrl(profile.avatar_url, 3600 * 3600); // 1 hour expiry
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blurred, darkened background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Centered form */}
      <div
        className="relative z-[102] bg-white dark:bg-[#141414] rounded-xl shadow-lg 
                  w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-xl xl:max-w-[530px] mx-auto
                  p-3 sm:p-8 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
          Account Information
        </h2>
        <p className="mb-6 text-center text-muted-foreground">
          View and update your personal information.
        </p>
        {profile && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const supabase = createClient();
              // STORING PATH ONLY 
              // let imageUrl = profile.avatar_url;

              // if (pendingAvatar) {
              //   const filePath = `${profile.id}/${Date.now()}-${pendingAvatar.name}`;
              //   const { error: uploadError } = await supabase.storage
              //     .from("avatars")
              //     .upload(filePath, pendingAvatar, {
              //       cacheControl: "31536000",
              //       upsert: true,
              //     });
              //   if (uploadError) {
              //     toast.error(uploadError.message);
              //     return;
              //   }
              //   imageUrl = filePath;
              // }

              // STORING SIGNED URL
              let imageUrl = profile.avatar_url;

              if (pendingAvatar) {
                const filePath = `${profile.id}/${Date.now()}-${pendingAvatar.name}`;
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
                  .createSignedUrl(filePath, 3600 * 3600); // 1 hour expiry
                imageUrl = data?.signedUrl ?? filePath;
              }

              let username = profile.username;
              if (!username && profile.fullname) {
                username = generateUsername(profile.fullname);
              }
              // Update profile in DB
              const { error } = await supabase
                .from("profiles")
                .update({
                  username,
                  first_name: profile.first_name,
                  middle_name: profile.middle_name,
                  last_name: profile.last_name,
                  age: profile.age,
                  avatar_url: imageUrl,
                  bio: profile.bio,
                  gender: profile.gender,
                })
                .eq("id", profile.id);
              if (!error) {
                toast.success("Profile Updated!");
                setFullName(profile.fullname);
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
            className="space-y-4"
          >
            <div>
              <div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-gray-300 group-hover:border-blue-500 transition shadow-xl">
                      {/* <AvatarImage
                        src={
                          avatarPreview
                          ?? (profile?.avatar_url
                            ? (profile.avatar_url.startsWith("http")
                              ? profile.avatar_url
                              : `/api/avatars?path=${encodeURIComponent(profile.avatar_url)}`)
                            : undefined)
                        }
                        alt={profile?.fullname ?? email ?? "User"}
                      /> */}
                      <AvatarImage
                        src={
                          avatarPreview
                          ?? signedAvatarUrl
                          ?? undefined
                        }
                        alt={profile?.fullname ?? email ?? "User"}
                      />
                      <AvatarFallback className="rounded-full text-3xl sm:text-4xl bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {[profile.first_name, profile.middle_name, profile.last_name]
                          .filter(Boolean)
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-full">
                      <span className="text-white text-lg font-semibold">Change</span>
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setPendingAvatar(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                <div>
                  <label>Bio</label>
                  <Input
                    value={profile.bio ?? "UI/UX  Designer"}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    className="mb-4"
                  />
                </div>
              </div>
              <label>Username</label>
              <Input
                value={profile.username ?? generateUsername(profile.fullname)}
                onChange={e => setProfile({ ...profile, username: e.target.value })}
              />
            </div>
            <div>
              <label>First Name</label>
              <Input
                value={profile.first_name || ""}
                onChange={e => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>
            <div>
              <label>Middle Name</label>
              <Input
                value={profile.middle_name || ""}
                onChange={e => setProfile({ ...profile, middle_name: e.target.value })}
                placeholder="(optional)"
              />
            </div>
            <div>
              <label>Last Name</label>
              <Input
                value={profile.last_name || ""}
                onChange={e => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>
            <div className="cursor-not-allowed">
              <label>Email</label>
              <Input
                value={email ?? "Cannot fetch User email"}
                disabled
              />
            </div>
            {/* TODO: Update their birthday??? */}
            <div>
              <label>Gender</label>
              <Input
                value={profile?.gender?.trim() || ""}
                onChange={e => setProfile({ ...profile, gender: e.target.value })}
                placeholder="Specify your gender"
              />
            </div>
            <footer className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-12">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="cursor-pointer w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer w-full sm:w-auto bg-[#ED5E20] text-[#FFF] hover:bg-[#d44e0f] dark:bg-[#d44e0f] dark:text-[#FFF] dark:hover:bg-[#ED5E20]"
              >
                Save Changes
              </Button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}