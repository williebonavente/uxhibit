import RegistrationForm from "@/components/register-form";
import { createClient } from "@/utils/supabase/client";
export default async function RegistrationPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return (

        <RegistrationForm user={user} />
    )
}