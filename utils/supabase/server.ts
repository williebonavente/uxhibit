"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;

export async function createClient() {
    const cookieStore = await cookies()

    // Create a server's supabase client with newly configured cookie
    // which could be used to maintain user's session

    return createServerClient(
        supabaseUrl!,
        supabaseKey!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options ))
                    } catch {
                        
                    }
                } 
            }
        }
    )
}