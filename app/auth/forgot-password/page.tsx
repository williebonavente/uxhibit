"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
// import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
// import { redirect } from "next/dist/server/api-utils";
// import { useRouter } from "next/router";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" })
})

export default function ForgotPasswordPage() {
  const form = useForm<{ email: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const [emailSent, setEmailSent] = useState(false);
  async function onSubmit(values: { email: string }) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email,
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
    
    );
    if (error) {
      toast.error(error.message || "Failed to send reset email.");
    } else {
      setEmailSent(true);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-[#141414] rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-4xl font-bold mt-3 mb-7 text-center text-[#0c0d0d]/90 dark:text-[#FAF8FC]/100">Reset Password</h2>
        <p className="mb-8 text-[18px] text-center">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        {emailSent ? (
          <div className="mb-6 w-full text-center text-green-600 dark:text-green-400 font-medium">
            Password reset email sent! Please check your inbox.
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <Input
              id="email"
              placeholder="Enter your email"
              type="email"
              autoComplete="email"
              className="w-full h-12 mb-6 input-lg input-placeholder-lg"
              {...form.register("email")}
            />
            <Button type="submit" className="w-full h-12 text-xl btn-login btn-login:hover cursor-pointer">
              Send Email
            </Button>
            <div className="mt-5 text-[18px] text-[#1E1E1E]/50 text-center">
              <Link href="/auth/login"
                className="text-[#ED5E20]/100 hover:text-[ED5E20] transition-colors duration-200 hover:underline">
                Back to Log In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}