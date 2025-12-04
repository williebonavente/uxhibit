export const dynamic = 'force-dynamic';

import RegistrationForm from "@/components/register-form";
import { createClient } from "@/utils/supabase/server";

export default async function RegistrationPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return (
        <RegistrationForm user={user ?? null} />
    )
}