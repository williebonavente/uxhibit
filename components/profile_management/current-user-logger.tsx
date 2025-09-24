"use client";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CurrentUserLogger() {
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            console.log("Current visiting userId:", user?.id);
        };
        fetchUser();
    }, []);
    return null;
}