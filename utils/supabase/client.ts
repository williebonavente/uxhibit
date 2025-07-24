import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    // create a supabase client on the browser with the project's credentials
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    )
}