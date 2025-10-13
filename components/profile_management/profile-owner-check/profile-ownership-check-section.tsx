"use client";
import ProfileOwnershipCheckClient from "./profile-owner-check-checklist";
import DesignsGallery from "@/components/designs-gallery";

export default function ProfileOwnershipCheckSection({ profileId }: { profileId: string }) {
  return (
    <ProfileOwnershipCheckClient profileId={profileId}>
      {(isOwner) => (
        <DesignsGallery profileId={profileId} isOwnProfile={isOwner} />
      )}
    </ProfileOwnershipCheckClient>
  );
}