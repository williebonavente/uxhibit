"use client"
// import { login } from './action';
import LoginForm from "@/components/login-form"
import { useEffect, useRef, useState } from "react";
import { logout } from "./action"
import { toast } from "sonner";
export default function LoginPage() {
    const hasLoggedOut = useRef(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!hasLoggedOut.current) {
            hasLoggedOut.current = true;
            (async () => {
                await logout();
                // toast.success("You have been log out.");
                setLoading(false);
            })();
            return;
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    return (
        <div>
            <LoginForm />
        </div>
    )
}
