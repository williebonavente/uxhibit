"use client";
import { useEffect, useState } from "react";
import ProfileContact from "./profile-contact";
import ProfileContactForm from "./profile-contact-form";
import { createClient } from "@/utils/supabase/client";

interface ProfileContactType {
    id: string;
    profile_details_id: string;
    email: string;
    website: string;
    open_to: string;
    extra_fields: string;

}

export default function ProfileContactClient({ profileDetailsId }: { profileDetailsId: string }) {
    const [contact, setContact] = useState<ProfileContactType | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function fetchContact() {
            console.log("Fetching contact for profileDetailsId:", profileDetailsId);
            const { data, error } = await supabase
                .from("profile_contacts")
                .select("id, profile_details_id, email, website, open_to, extra_fields")
                .eq("profile_details_id", profileDetailsId)
                .single();
            console.log("Error: ", error);
            if (data) setContact(data);
        }
        fetchContact();
    }, [profileDetailsId, isEditing, supabase]);

    useEffect(() => {
        async function checkOwner() {
            const { data: { user }, error } = await supabase.auth.getUser();
            console.log("Error: ", error);

            const { data: profileDetails } = await supabase
                .from("profile_details")
                .select("profile_id")
                .eq("id", profileDetailsId)
                .single();

            setIsOwner(Boolean(user && profileDetails && user.id === profileDetails.profile_id));
        }
        checkOwner();
    }, [profileDetailsId, supabase]);

    // console.log("isOwner:", isOwner);
    // console.log("contact:", contact);
    // console.log("isEditing:", isEditing);

    return (
        <>
            {isEditing && isOwner ? (
                <ProfileContactForm
                    profileDetailsId={profileDetailsId}
                    initialContact={contact}
                    onSave={() => { setIsEditing(false); }}
                />
            ) : (
                <>
                    <ProfileContact
                        email={contact?.email ?? ""}
                        website={contact?.website ?? ""}
                        openTo={contact?.open_to ?? ""}
                        extraFieldsRaw={contact?.extra_fields ?? ""}
                        isOwner={isOwner}
                        onEdit={() => setIsEditing(true)} icon={"star"} />
                </>
            )}
        </>
    );
}