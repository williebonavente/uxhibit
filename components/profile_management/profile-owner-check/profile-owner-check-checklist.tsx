"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ProfileOwnershipCheckClient({
  profileId,
  children,
}: {
  profileId: string;
  children: (isOwner: boolean) => React.ReactNode;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileDetails } = await supabase
        .from("profile_details")
        .select("profile_id")
        .eq("profile_id", profileId)
        .single();

      const ownerCheck = Boolean(user && profileDetails && user.id === profileDetails.profile_id);
      setIsOwner(ownerCheck);
    }
    checkOwner();
  }, [profileId]);

  // Call children as a function
  return <>{children(isOwner)}</>;
}