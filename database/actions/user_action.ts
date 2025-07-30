import { createClient } from "@/utils/supabase/client";

export async function fetchUserName() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
        const { data } = await supabase
            .from("learner_profile")
            .select("name")
            .eq("id", authData.user.id)
            .single();
        return data?.name || null;
    }

    return null;
}


export async function fetchUserEmail() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
        const { data } = await supabase
            .from("learner_profile")
            .select("email")
            .eq("id", authData.user.id)
            .single()
        return data?.email || null;
    }
    return null;
}



